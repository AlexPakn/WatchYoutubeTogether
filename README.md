# Watch Youtube Together

## Installation & Setup Guide

Follow these steps to set up and run the Watch Youtube Together project on a new PC.

### Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Visual Studio 2022](https://visualstudio.microsoft.com/vs/) (or later) with ASP.NET and web development workload
- [PostgreSQL](https://www.postgresql.org/download/)
- [Node.js](https://nodejs.org/) (optional, for frontend tooling or Live Server extension)

### Steps

1. **Download from GIT**

- download this project to your desired location.

2. **Update Configuration**

- Create `appsettings.json` and create the database connection string to match your PostgreSQL setup.
- Create the SMTP email settings with your own credentials to enable email sending.

- This is how it should look like:
```sh
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=port;Database=watch_youtube_together_db;Username=your_user;Password=your_password"
  },

  "Smtp": {
    "Host": "smtp.gmail.com",
    "Port": "587",
    "Username": "your_email",
    "Password": "your_email_app_password",
    "From": "yuor_email"
  },

  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
```

3. **Database Setup**

- Before applying migrations, install the EF Core CLI tools (if not already installed):

```sh
dotnet tool install --global dotnet-ef
```
- Apply migrations (if using Entity Framework):

```sh
dotnet ef database update
```

4. **Build the Project**


5. **Run the Server**


- The API will be available at the URL shown in the console (typically `http://localhost:5501` or similar).

- After running, API docs are available at: `http://localhost:5501/swagger` (or the port shown in your console).

### "Watch Youtube Together Frontend" (`Watch_together_frontend`)

- The file `index.html` **must not be opened directly as a local file** (e.g., `file:///C:/.../...index.html`), as browser security restrictions will prevent it from working correctly.
- **Recommended:** Use a local web server to serve the file. For example, with the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension in Visual Studio Code:
1. Open the folder `Watch_together_frontend` in VS Code.
2. Open index.html, then in the bottom right press the button **"Go Live"**.
3. The file will open in your browser at `http://localhost:PORT/index.html`.

- Alternatively, you can use any other static file server (e.g. `npx serve`, Python's `http.server`, etc.).

- CORS is configured for http://localhost:5500 and http://127.0.0.1:5500. If you use a different port, you should update the CORS policy in Program.cs.

### Additional Notes


- Ensure all environment variables and configuration files are set up as required for your environment.
- For any issues, check the project documentation.

---
