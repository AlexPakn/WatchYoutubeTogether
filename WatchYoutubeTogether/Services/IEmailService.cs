namespace WatchYoutubeTogether.Services;

public interface IEmailService
{
	Task SendConfirmationEmail(string toEmail, string confirmUrl);
}
