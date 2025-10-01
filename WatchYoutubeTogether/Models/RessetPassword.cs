namespace WatchYoutubeTogether.Models;

public class RessetPassword
{
	public int Id { get; set; }

	public string UserEmail { get; set; }

	public string Password { get; set; }

	public string Key { get; set; }

	public DateTime ExpiryDate { get; set; }
}
