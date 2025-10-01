using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;

namespace WatchYoutubeTogether.Services;

public class PosterService : IPosterService
{
	private readonly string _profilesDirectory;

	public PosterService(IWebHostEnvironment env)
	{
		_profilesDirectory = Path.Combine(env.WebRootPath, "profiles");
		if (!Directory.Exists(_profilesDirectory))
			Directory.CreateDirectory(_profilesDirectory);
	}

	public async Task<string> SaveProfileAsync(IFormFile picture)
	{
		if (picture == null || picture.Length == 0)
			throw new ArgumentException("Invalid profile picture.");

		var extension = Path.GetExtension(picture.FileName);
		if (string.IsNullOrEmpty(extension) || !new[] { ".jpg", ".jpeg", ".png" }.Contains(extension.ToLower()))
			throw new ArgumentException("Unsupported file type. Only .jpg, .jpeg, .png are allowed.");


		var fileName = Guid.NewGuid().ToString() + extension;
		var fullPath = Path.Combine(_profilesDirectory, fileName);

		using (var image = await Image.LoadAsync(picture.OpenReadStream()))
		{
			// Target even smaller than 480p, e.g., 200x200 (square thumbnail)
			const int targetSize = 200;
			int newWidth, newHeight;
			if (image.Width > image.Height)
			{
				newHeight = targetSize;
				newWidth = (int)((double)image.Width / image.Height * targetSize);
			}
			else
			{
				newWidth = targetSize;
				newHeight = (int)((double)image.Height / image.Width * targetSize);
			}
			image.Mutate(x => x.Resize(newWidth, newHeight).Crop(new Rectangle((newWidth - targetSize) / 2, (newHeight - targetSize) / 2, targetSize, targetSize)));

			await image.SaveAsync(fullPath);
		}

		return fileName;
	}
	public async Task<bool> DeleteFileByNameAsync(string fileName)
	{
		if (string.IsNullOrWhiteSpace(fileName))
			return false;

		bool deleted = false;
		var filePath = Path.Combine(_profilesDirectory, fileName);
		if (File.Exists(filePath))
		{
			try
			{
				await Task.Run(() => File.Delete(filePath));
				deleted = true;
			}
			catch
			{
				// Optionally log error
			}
		}
		return deleted;
	}
}