# Contributing

We are open to, and grateful for, any contributions made by the community.

## Reporting issues and asking questions

Before opening an issue, please search the [issue tracker](https://github.com/redux-form/redux-form/issues) to make sure your issue hasn’t already been reported.

**We use the issue tracker to keep track of bugs and improvements** to Redux Form itself, its examples, and the documentation. We encourage you to open issues to discuss improvements, architecture, internal implementation, etc. If a topic has been discussed before, we will ask you to join the previous discussion.

For support or usage questions, please search and ask on [StackOverflow with a `redux-form` tag](https://stackoverflow.com/questions/tagged/redux-form) or [Gitter](https://gitter.im/erikras/redux-form). We ask you to do this because StackOverflow has a much better job at keeping popular questions visible. Unfortunately good answers get lost and outdated on GitHub.

**If you already asked at StackOverflow or Gitter and still got no answers, post an issue with the question link, so we can either answer it or evolve into a bug/feature request.**

## Sending a pull request

For non-trivial changes, please open an issue with a proposal for a new feature or refactoring before starting on the work. We don’t want you to waste your efforts on a pull request that we won’t want to accept.

Please try to keep your pull request focused in scope and avoid including unrelated commits.

After you have submitted your pull request, we’ll try to get back to you as soon as possible. We may suggest some changes or improvements.

# Instructions for new contributors

- Make a fork of https://github.com/redux-form/redux-form and a branch off that fork
- Install deps: `npm install`
- Change the code to implement your feature/fix
- When you're ready to commit run flow typechecker: `npm run test:flow`
- And the full test suite: `npm run test`
- And/or check the test coverage: `npm run test:cov` (this will check if you've added any new code that is not exercised by the test suite)
- The pre-commit hooks should do a sanity-check build
- Once committed, pull request your branch into https://github.com/redux-form/redux-form
