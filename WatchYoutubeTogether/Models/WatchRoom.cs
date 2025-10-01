using System.ComponentModel.DataAnnotations;

namespace WatchYoutubeTogether.Models;

public class WatchRoom
{
	public int Id { get; set; }

	[Required]
	public string RoomCode { get; set; }

	public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

	public bool IsPrivate { get; set; } = false;

	public string? PasswordHash { get; set; }

	public ICollection<WatchRoomUser> Users { get; set; } = new List<WatchRoomUser>();
}
