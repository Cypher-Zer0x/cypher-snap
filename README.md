# cypher-zer0x : Metamask snap

This repository demonstrates how to develop a snap with TypeScript. For detailed
instructions, see [the MetaMask documentation](https://docs.metamask.io/guide/snaps.html#serving-a-snap-to-your-local-environment).

MetaMask Snaps is a system that allows anyone to safely expand the capabilities
of MetaMask. A _snap_ is a program that we run in an isolated environment that
can customize the wallet experience.

## Snaps is pre-release software

To interact with (your) Snaps, you will need to install [MetaMask Flask](https://metamask.io/flask/),
a canary distribution for developers that provides access to upcoming features.

## Getting Started

- Clone this repository: 
```shell 
git clone https://github.com/Cypher-Zer0x/cypher-snap.git
```
- Install the dependencies and start the applications:
```shell
yarn install && yarn start
```

## SNAP functionalities

### Send and receive tokens
Easily send and receive tokens on the Cypher Zer0x blockchain using our private transactions mechanism.

### Customized and Interactive UI
An intuitive and user-friendly interface that allows you to manage your assets and transactions with ease. Powered by Metamask [interactive-UI](https://docs.metamask.io/snaps/features/custom-ui/)

### multi-language support
Cypher Zer0x supports multiple languages, including English, French, and more. (It automatically detects the language of your browser)

### Transaction insights and alerts
Get real-time insights into your transactions and receive alerts for any suspicious activity regarding our Plasma contracts


### Bridge with 8+ supported networks
Cypher Zer0x is a Plasma L2 rollup which is natively plugged on 8+ blockchain, including Linea, Ethereum, Polygon, Zircuit and more.
This allows you to bridge your assets between different networks and use them privately on Cypher Zer0x.


### Testing and Linting

Run `yarn test` to run the tests once.

Run `yarn lint` to run the linter, or run `yarn lint:fix` to run the linter and
fix any automatically fixable issues.
