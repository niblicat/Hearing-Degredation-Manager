# Hearing Degredation Manager
Manage employee hearing data and communicate changes to employees!

Table of contents
1. [Limitations](#limitations)
2. [Requirements to Deploy](#requirements-to-deploy)
3. [Setting up Your Project](#setting-up-your-project)
    1. [Repository Setup](#repository-setup)
    2. [Vercel Setup](#vercel-setup)
    3. [OAuth Setup](#oauth-setup)
    4. [Finishing Touches](#finishing-touches)
4. [Simple Website Modification](#simple-website-modification)

## Limitations
- Only allows for yearly hearing screenings (multiple in the same year is not possible).
- 

## Requirements to Deploy
- Git CLI or GitHub Desktop
- Repository service (i.e. GitHub or GitLab) for [CI/CD](https://en.wikipedia.org/wiki/CI/CD)
- Vercel account

## Setting Up Your Project
This will describe how to set up a new hearing degredation manager from scratch.
### Repository Setup
First, we will create a new repository from this one for your own version of the portal. With GitHub, we can [import a repository](https://docs.github.com/en/migrations/importing-source-code/using-github-importer/about-github-importer).

The URL for the source repository is `https://github.com/niblicat/slhc-software.git`. You should not require credentials to import it. Name it whatever you wish. Once you are done, copy your new repository's HTTPS web URL.
![Red box and arrow indication of where to find the HTTPS web URL on GitHub](readme-resources/readme_upstream_url.png)

In the command line/terminal, you should now clone your new repository using your new repository's link.
```git
git remote set-url origin {YOUR NEW REPOSITORY'S LINK}
```
### Vercel Setup
If you do not have a Vercel account already, I recommend that you create one using the repository service account that you're using for this project for easy project linking.

[Add a new Vercel project using your Git repository](https://vercel.com/docs/git).
Navigate to the 'Storage' tab. [Add a Postgres database to your Vercel project](https://vercel.com/docs/postgres). We used Neon.

Once it has been created, click 'Open in Neon' in the 'Storage' tab.
![Red box and arrow indication of where to click on Vercel to open Neon](readme-resources/readme_open_neon.png)

In Neon, navigate to the SQL Editor. Here, copy and paste the contents of [the Postgres table setup file](postgres-setup.sql).
![Red box and arrow indication of where to click on Neon to find the SQL Editor](readme-resources/readme_sql_editor.png)

### OAuth Setup
Note that you only need one authentication method to use this project, but you will still see both login with Google and Github buttons unless you configure your project otherwise (see the [Simple Website Modification](#simple-website-modification) section to change that or to learn how to add other authenticaton providers).

#### Authorization Secret
You need an authorization secret. View the [Auth.js guide](https://authjs.dev/guides/environment-variables#auth-secret) on how to generate one (you will need [NPM](https://nodejs.org/en/download/)). Alternatively, you can [generate one online](https://auth-secret-gen.vercel.app), but it's not recommended. Make sure to record the value that is generated for later.

#### Authorization Platforms
On the project tab of Vercel, you can find your project's deployment domain. If you have your own domain that you want to use, you can set it up in Vercel's settings. This will be important for setting up authentication. Let's assume your website is `https://example.vercel.app` for the following steps.

For GitHub authentication, [follow GitHub's "Creating an OAuth app" guide](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app).
- **Homepage URL**: `https://example.vercel.app`
- **Authorization Callback URL**: `https://example.vercel.app/auth/callback/github`
Make sure to record the following:
- Client ID
- Client Secret (it should allow you to generate a secret)

For Google authentication, [follow Google's "Using OAuth 2.0 to Access Google APIs" guide](https://developers.google.com/identity/protocols/oauth2).
- **Authorized Javascript Origin**: `https://example.vercel.app`
- **Authorized redirect URI**: `https://example.vercel.app/auth/callback/google`
Make sure to record the following:
- Client ID
- Client Secret (it should allow you to generate a secret)

### Finishing Touches
In Vercel, you now need to set up your environment variables for working authorization. In your Vercel project, navigate through Settings > Environment Variables.
![Red box and arrow indication of where to find project's environment variables on Vercel](readme-resources/readme_env_vars.png)
For each of your authentication choices, you must enter keys and values to match up with what you recorded earlier. Assuming you intend to implement both Google and Github Authentication, you would need the following:
| Key                   | Value                 |
| :-------------------- | :-------------------- |
| AUTH_SECRET           | {VALUE YOU COPIED}    |
| AUTH_GITHUB_ID        | {VALUE YOU COPIED}    |
| AUTH_GITHUB_SECRET    | {VALUE YOU COPIED}    |
| AUTH_GOOGLE_ID        | {VALUE YOU COPIED}    |
| AUTH_GOOGLE_SECRET    | {VALUE YOU COPIED}    |

Back in your Vercel project, navigate to the 'Deployments' tab and click the three dots next to your latest production deployment. In the menu that pops up, click 'Redeploy'.
![Red box and arrow indication of where to find the redeploy button on Vercel](readme-resources/readme_sql_editor.png)

It should deploy correctly if you have done everything correctly. To modify your website to suit your needs, see the next section, [Simple Website Modification](#simple-website-modification).

## Simple Website Modification
### Public Homepage
This is the first thing you see prior to logging in!
### Dashboard Homepage
This is the page you see after logging in!
### Authentication Providers

## Running the project locally
Install the required packages
```
npm i
```

Use Vercel CLI (later versions may not work)
```
pnpm i -g vercel@37.4.2
```

Setup the environment variables

Now run the project!
```
vercel dev
```