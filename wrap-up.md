## Questions

### What issues, if any, did you find with the existing code?

- There were several major vulnerabilities in the install that I would have liked to have fixed with updates, but was unsure as
  to how much time that could take in regard to breaking changes
- Wasn't a breaking issue, but I noticed we were using the account_number directly for reference, when standard is to use an id.
- The error messaging was fairly lacking as it was

### What issues, if any, did you find with the request to add functionality?

- I struggled a bit with the fact that this was seemingly reliant on docker build to work. I believe the hard-coded localhosts for ui and api made live local development a bit arduous and I refrained from updating (either the localhosts or the 'start' method).

### Would you modify the structure of this project if you were to start it over? If so, how?

- I would wrap the entire project with vite (or something comparable) to be able to get quick feedback on local development

### Were there any pieces of this project that you were not able to complete that you'd like to mention?

- Would have liked to add error specific language on the inputs when the network had failed

### If you were to continue building this out, what would you like to add next?

- I'd add testing to both the front and back end (cypress & jest/react-testing-library)
- I'd update all packages to the most modern version, especially to eliminate the vulnerabilities discovered on install
- I'd wrap the entire project in something (perhaps vite) that would allow for me to run both packages locally in dev and view up-to-date changes more easily than relying on docker
- I only added basic error styling to the input messages, I would add some further styling beyond that to give the page a bit of a pop (headings, text-color, etc)
- I'd add error specific language on the inputs when they fail at the network level
- I'd make the hosts dynamic for both ui and api. I started this with api, but it's only half-baked currently. This would play well with the point I made about wrapping the app with next.
- I might extend my client pool to the user as well to keep the user logged in (it gets lost on refresh). The alternative to this is to keep that state in session storage.

### If you have any other comments or info you'd like the reviewers to know, please add them below.

Just for context, I've not worked heavily, or even at all, with most of the backend pieces for this project. This is not to say
I can't, just to point out that much of it is a fairly unfamiliar area as I've been very focused on Front End concerns in the last 10 years or so.

- I've worked minimally with express on a handful of features, so was fairly familiar with it
- I've never directly worked with postgreSQL, though have in the past worked with other SQL and MySQL
- I've never worked with Joi, although have worked extensively with Zod which is similar
- I've worked on several projects which use docker and have had to interact with it, but for the most part those scripts have been abstracted in the projects I've worked with.

Given that this exercise emphasized transaction validation and business logic, I invested heavily in the backend while leveraging my 10+ years of frontend expertise for the UI. This demonstrated my ability to own a full-stack feature while recognizing where the complexity actually lived.
