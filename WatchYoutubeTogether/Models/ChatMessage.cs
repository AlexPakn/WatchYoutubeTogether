namespace WatchYoutubeTogether.Models;

public class ChatMessage
{
	public int Id { get; set; }
	public int UserId { get; set; }
	public User User { get; set; } = null!;
	public string RoomCode { get; set; } = null!;
	public string Message { get; set; } = null!;
	public DateTime SentAt { get; set; } = DateTime.UtcNow;
}
