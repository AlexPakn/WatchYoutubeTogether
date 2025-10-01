using Microsoft.EntityFrameworkCore;
using WatchYoutubeTogether.Models;

namespace WatchYoutubeTogether;

public class AppDbContext : DbContext
{
	public DbSet<EmailConfirm> EmailConfirms { get; set; }
	public DbSet<RessetPassword> RessetPasswords { get; set; }
	public DbSet<User> Users { get; set; }
	public DbSet<UserToken> UserTokens { get; set; }
	public DbSet<WatchRoom> WatchRooms { get; set; } = default!;
	public DbSet<WatchRoomUser> WatchRoomUsers { get; set; } = default!;
	public DbSet<ChatMessage> ChatMessages { get; set; }

	public AppDbContext(DbContextOptions<AppDbContext> options)
		: base(options)
	{
	}
	protected override void OnModelCreating(ModelBuilder modelBuilder)
	{
		// User: unique index on Email
		modelBuilder.Entity<User>()
			.HasIndex(u => u.Email)
			.IsUnique();

		// UserToken: зв’язок User -> UserToken
		modelBuilder.Entity<UserToken>()
			.HasOne(t => t.User)
			.WithMany(u => u.Tokens)
			.HasForeignKey(t => t.UserId);

		// WatchRoom: 
		modelBuilder.Entity<WatchRoom>()
		.HasIndex(r => r.RoomCode)
		.IsUnique(); // Чтобы комната имела уникальный код

		modelBuilder.Entity<WatchRoomUser>()
			.HasOne(u => u.WatchRoom)
			.WithMany(r => r.Users)
			.HasForeignKey(u => u.WatchRoomId)
			.OnDelete(DeleteBehavior.Cascade); // Если комната удалена — удалить и участников

		// ChatMessage
		modelBuilder.Entity<ChatMessage>()
			.HasOne(m => m.User)
			.WithMany()
			.HasForeignKey(m => m.UserId)
			.OnDelete(DeleteBehavior.Cascade); // При удалении юзера — удалить его сообщения

		modelBuilder.Entity<ChatMessage>()
			.HasIndex(m => m.RoomCode); // Индекс для быстрого поиска сообщений по комнате
	}
}