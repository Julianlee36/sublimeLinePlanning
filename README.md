# Ultimate Frisbee Stats Tracker
asjfhgsadkljfhsadlkjfhsadljkh
This is a React application for tracking ultimate frisbee stats during a game.

## Tech Stack

- React with Vite
- TypeScript
- Tailwind CSS
- Supabase

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd ultimate-stats-tracker
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Supabase:**
    - Create a new project on [Supabase](https://supabase.com/).
    - In your Supabase project, go to the `SQL Editor` and run the SQL queries in `supabase/schema.sql` to create the necessary tables.
    - Go to `Settings` > `API` and find your Project URL and anon public key.
    - Create a `.env` file in the root of the project and add your Supabase credentials:
      ```
      VITE_SUPABASE_URL=your-supabase-url
      VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
      ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

    The application will be available at `http://localhost:5173`.

## Deployment

This application is ready to be deployed to [Vercel](https://vercel.com/).

- Connect your Git repository to Vercel.
- Configure the environment variables for your Supabase project in the Vercel dashboard.
- Vercel will automatically build and deploy your application.
