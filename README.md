# blank-project

This app was initialized with [create-evm-app]

# Quick Start

If you haven't installed dependencies during setup:

    yarn install

Build and Deploy your contract to local network:

    yarn deploy

Test your contract:

    yarn test

If you have a frontend, run `yarn start`. This will run a dev server.

# Exploring The Code

1. The smart-contract code lives in the `/contract` folder. See the README there for
   more info. In blockchain apps the smart contract is the "backend" of your app.
2. The frontend code lives in the `/frontend` folder. `/frontend/index.html` is a great
   place to start exploring. Note that it loads in `/frontend/index.js`,
   this is your entrypoint to learn how the frontend connects to the NEAR blockchain.
3. Test your contract: `yarn test`, this will run the tests in `integration-tests` directory.
