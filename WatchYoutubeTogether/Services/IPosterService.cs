namespace WatchYoutubeTogether.Services;

public interface IPosterService
{
	Task<string> SaveProfileAsync(IFormFile picture);
	Task<bool> DeleteFileByNameAsync(string fileName);
}
