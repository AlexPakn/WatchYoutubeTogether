namespace WatchYoutubeTogether.Models;

public class EmailConfirm
{
	public int Id { get; set; }

	public string UserEmail { get; set; }

	public string Key { get; set; }

	public DateTime ExpiryDate { get; set; }
}
