
## Environment Configuration

To configure the environment variables for the project, follow these steps:

1. Create a `.env.local` file in the `fe` directory if it does not already exist.
2. Add the following example variables to the `.env.local` file:

```
# Example environment variables
API_BASE_URL=http://localhost:9999/api
```

3. Replace the values of the variables with the appropriate values for your environment.

- `API_BASE_URL`: The base URL for the API.

4. Save the file. The application will automatically load these variables when it starts.
