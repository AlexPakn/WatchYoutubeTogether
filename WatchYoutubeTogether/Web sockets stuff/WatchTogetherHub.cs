using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Text.RegularExpressions;
using WatchYoutubeTogether.Models;
using WatchYoutubeTogether.Services;

namespace WatchYoutubeTogether.Web_sockets_stuff;

public class WatchTogetherHub : Hub
{
	private readonly AppDbContext _context;
	private readonly AuthService _authService;

	public WatchTogetherHub(AppDbContext context, AuthService authService)
	{
		_context = context;
		_authService = authService;
	}

	public async Task JoinRoom(string roomCode, string? password = null)
	{
		var httpContext = Context.GetHttpContext();
		if (httpContext == null)
		{
			Context.Abort();
			return;
		}

		// Read access token from query parameters
		string? accessToken = httpContext.Request.Query["access_token"];
		if (string.IsNullOrWhiteSpace(accessToken))
		{
			await Clients.Caller.SendAsync("ReceiveCommand", "unauthorized", new { message = "Missing access token" });
			Context.Abort();
			return;
		}

		var user = await _authService.GetUserByAccessToken(accessToken);
		if (user == null)
		{
			await Clients.Caller.SendAsync("ReceiveCommand", "unauthorized", new { message = "Invalid or expired access token" });
			Context.Abort();
			return;
		}

		await Groups.AddToGroupAsync(Context.ConnectionId, roomCode);

		var room = await _context.WatchRooms
			.Include(r => r.Users)
			.FirstOrDefaultAsync(r => r.RoomCode == roomCode);

		if (room != null)
		{
			if (room.IsPrivate)
			{
				if (string.IsNullOrWhiteSpace(password))
				{
					await Clients.Caller.SendAsync("ReceiveCommand", "unauthorized", new { message = "Password required" });
					Context.Abort();
					return;
				}

				if (!BCrypt.Net.BCrypt.Verify(password, room.PasswordHash))
				{
					await Clients.Caller.SendAsync("ReceiveCommand", "unauthorized", new { message = "Incorrect password" });
					Context.Abort();
					return;
				}
			}
		}
		else
		{
			room = new WatchRoom
			{
				RoomCode = roomCode,
				CreatedAt = DateTime.UtcNow,
				IsPrivate = !string.IsNullOrWhiteSpace(password),
				PasswordHash = string.IsNullOrWhiteSpace(password) ? null : BCrypt.Net.BCrypt.HashPassword(password)
			};

			_context.WatchRooms.Add(room);
			await _context.SaveChangesAsync();
		}

		// host role is assigned to the first user in the room
		var role = room.Users.Any() ? "guest" : "host";

		var userEntry = new WatchRoomUser
		{
			ConnectionId = Context.ConnectionId,
			WatchRoomId = room.Id,
			Role = role,
			UserId = user.Id
		};

		_context.WatchRoomUsers.Add(userEntry);
		await _context.SaveChangesAsync();
	}

	public async Task LeaveRoom(string roomCode)
	{
		await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomCode);

		var room = await _context.WatchRooms
			.Include(r => r.Users)
			.FirstOrDefaultAsync(r => r.RoomCode == roomCode);

		if (room == null)
			return;

		var user = room.Users.FirstOrDefault(u => u.ConnectionId == Context.ConnectionId);
		if (user != null)
		{
			bool wasHost = user.Role == "host";
			_context.WatchRoomUsers.Remove(user);
			await _context.SaveChangesAsync();

			// If the user was host and there are still users, assign host to the next user
			if (wasHost)
			{
				// Reload users after removal
				var updatedRoom = await _context.WatchRooms
					.Include(r => r.Users)
					.FirstOrDefaultAsync(r => r.Id == room.Id);

				var nextUser = updatedRoom?.Users.FirstOrDefault();
				if (nextUser != null)
				{
					nextUser.Role = "host";
					await _context.SaveChangesAsync();

					await Clients.Client(nextUser.ConnectionId)
					.SendAsync("ReceiveCommand", "set_role", new { role = "host" });

				}
			}
		}

		// If no users left, delete the room and its chat messages
		room = await _context.WatchRooms
			.Include(r => r.Users)
			.FirstOrDefaultAsync(r => r.RoomCode == roomCode);

		if (room != null && room.Users.Count == 0)
		{
			// Delete all chat messages for this room
			var chatMessages = _context.ChatMessages.Where(m => m.RoomCode == roomCode);
			_context.ChatMessages.RemoveRange(chatMessages);

			_context.WatchRooms.Remove(room);
			await _context.SaveChangesAsync();
		}
	}

	public async Task SendCommand(string roomCode, string command, object data)
	{
		var room = await _context.WatchRooms
			.Include(r => r.Users)
			.FirstOrDefaultAsync(r => r.RoomCode == roomCode);

		var user = room?.Users.FirstOrDefault(u => u.ConnectionId == Context.ConnectionId);
		if (user == null)
			return;

		if (command == "get_role")
		{
			await Clients.Client(Context.ConnectionId)
				.SendAsync("ReceiveCommand", "set_role", new { role = user.Role });
			return;
		}

		switch (command)
		{
			case "transfer_host":
				{
					if (user.Role != "host")
						return;

					if (data is JsonElement json && json.TryGetProperty("userId", out var userIdProp) && userIdProp.TryGetInt32(out int userId))
					{
						var targetUser = room.Users.FirstOrDefault(u => u.UserId == userId);
						if (targetUser == null || targetUser.ConnectionId == Context.ConnectionId)
							return;

						user.Role = "guest";
						targetUser.Role = "host";
						await _context.SaveChangesAsync();

						await Clients.Client(targetUser.ConnectionId)
							.SendAsync("ReceiveCommand", "set_role", new { role = "host" });

						await Clients.Client(Context.ConnectionId)
							.SendAsync("ReceiveCommand", "set_role", new { role = "guest" });
					}
					break;
				}

			case "kick":
				{
					if (user.Role != "host")
						return;

					if (data is JsonElement json && json.TryGetProperty("userId", out var userIdProp) && userIdProp.TryGetInt32(out int userId))
					{
						var kickedUser = room.Users.FirstOrDefault(u => u.UserId == userId);
						if (kickedUser == null || kickedUser.ConnectionId == Context.ConnectionId)
							return;

						_context.WatchRoomUsers.Remove(kickedUser);
						await _context.SaveChangesAsync();

						await Clients.Client(kickedUser.ConnectionId)
							.SendAsync("ReceiveCommand", "kicked", new { message = "You were kicked by the host" });

						await Groups.RemoveFromGroupAsync(kickedUser.ConnectionId, roomCode);
					}
					break;
				}

			case "set_password":
				{
					if (user.Role != "host")
						return;

					if (data is JsonElement json && json.TryGetProperty("password", out var passwordProp))
					{
						string? password = passwordProp.GetString();
						room.IsPrivate = !string.IsNullOrEmpty(password);
						room.PasswordHash = string.IsNullOrEmpty(password) ? null : BCrypt.Net.BCrypt.HashPassword(password);
						await _context.SaveChangesAsync();

						await Clients.Caller.SendAsync("ReceiveCommand", "password_updated", new { success = true });
					}
					break;
				}

			case "chat_message":
				{
					if (data is JsonElement json && json.TryGetProperty("text", out var textProp))
					{
						string? message = textProp.GetString();
						if (string.IsNullOrWhiteSpace(message))
							return;

						var chatMessage = new ChatMessage
						{
							UserId = user.UserId ?? 0,
							RoomCode = roomCode,
							Message = message,
							SentAt = DateTime.UtcNow
						};

						// Save chat message to database
						_context.ChatMessages.Add(chatMessage);
						await _context.SaveChangesAsync();

						var chatData = new
						{
							message = chatMessage.Message,
							userId = chatMessage.UserId,
							sentAt = chatMessage.SentAt
						};

						await Clients.Group(roomCode)
							.SendAsync("ReceiveCommand", command, chatData);
					}
					break;
				}

			default:
				{

					await Clients.GroupExcept(roomCode, Context.ConnectionId)
						.SendAsync("ReceiveCommand", command, data);
					break;
				}
		}
	}

	public async Task GetChatHistory(string roomCode)
	{
		var messages = await _context.ChatMessages
		.Where(m => m.RoomCode == roomCode)
		.Include(m => m.User)
		.OrderBy(m => m.SentAt)
		.Select(m => new
		{
			message = m.Message,
			userId = m.UserId,
			sentAt = m.SentAt
		})
		.ToListAsync();

		await Clients.Caller.SendAsync("ReceiveCommand", "chat_history", messages);

	}

	public override async Task OnDisconnectedAsync(Exception? exception)
	{
		var user = await _context.WatchRoomUsers
			.Include(u => u.WatchRoom)
			.ThenInclude(r => r.Users)
			.FirstOrDefaultAsync(u => u.ConnectionId == Context.ConnectionId);

		if (user == null)
			return;

		var room = user.WatchRoom;

		_context.WatchRoomUsers.Remove(user);
		await _context.SaveChangesAsync();

		// Reload the room with updated users
		var updatedRoom = await _context.WatchRooms
			.Include(r => r.Users)
			.FirstOrDefaultAsync(r => r.Id == room.Id);

		if (updatedRoom == null)
			return;


		if (updatedRoom.Users.Count == 0)
		{
			// Delete all chat messages for this room
			var chatMessages = _context.ChatMessages.Where(m => m.RoomCode == updatedRoom.RoomCode);
			_context.ChatMessages.RemoveRange(chatMessages);

			_context.WatchRooms.Remove(updatedRoom);
			await _context.SaveChangesAsync();
		}
		else if (user.Role == "host")
		{
			// If the user was host, assign host to the next user
			var next = updatedRoom.Users.FirstOrDefault();
			if (next != null)
			{
				next.Role = "host";
				await _context.SaveChangesAsync();

				await Clients.Client(next.ConnectionId)
				.SendAsync("ReceiveCommand", "set_role", new { role = "host" });
			}
		}

		await base.OnDisconnectedAsync(exception);
	}

}






// Отправить ВСЕМ участникам кроме отправителя
//await Clients.GroupExcept(roomId, Context.ConnectionId).SendAsync("ReceiveCommand", command, data);