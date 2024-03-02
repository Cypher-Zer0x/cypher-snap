import { panel, heading, text, copyable, divider } from '@metamask/snaps-ui';
import { OnTransactionHandler } from '@metamask/snaps-sdk';
import { locale, userAddress } from '../keys';
import { stringFromAmount } from '../utils/convert-types/stringFromAmount';

/*
48899 : 0x991a0FAeE936aDDba6b444C48Ad1c8Ec04D9a208, // Zircuit Testnet
80001 : 0xcbe5f301853d365c0B311AB331f56AAC0d39d6b0, // Mumbai Testnet
11155111 : 0x8DbDf7A6008531ED1fB301D4d61C0a883Ae0FA0b, // Sepolia
59140 : 0x991a0FAeE936aDDba6b444C48Ad1c8Ec04D9a208, // Linea Testnet
1313161555 : 0x991a0FAeE936aDDba6b444C48Ad1c8Ec04D9a208, // Aurora Testnet
51 : 0x991a0FAeE936aDDba6b444C48Ad1c8Ec04D9a208, // XDC Testnet
23295 : 0x991a0FAeE936aDDba6b444C48Ad1c8Ec04D9a208, // Oasis Testnet
296 : 0x991a0FAeE936aDDba6b444C48Ad1c8Ec04D9a208, // Hedera Testnet
*/

export const onTransaction: OnTransactionHandler = async ({
  transaction,
  chainId,
  transactionOrigin,
}) => {
  let urlVerified = 'Origin URL is unknown';
  if (transactionOrigin !== undefined && transactionOrigin !== null) {
    const referrer = new URL(transactionOrigin);

    if (referrer.protocol === "https:" &&
      (referrer.host.endsWith(".zer0x.xyz") ||
        referrer.host === "zer0x.xyz")) {
      console.log("URL is valid");
      urlVerified = '✅ Origin URL is valid';
    }
    else {
      console.log("URL is NOT valid");
      urlVerified = '❌ Origin URL is NOT from zer0x.xyz domain';
    }
  }

  const formatedValue = transaction.value ? `**${stringFromAmount(BigInt(transaction.value), 18)} ETH**` : '**0 ETH**';


  let insights: any[] = [];
  switch (await locale()) {
    case 'fr':
      if (
        transaction.to.toLowerCase() === '0x991a0FAeE936aDDba6b444C48Ad1c8Ec04D9a208'.toLowerCase() ||
        transaction.to.toLowerCase() === '0x8DbDf7A6008531ED1fB301D4d61C0a883Ae0FA0b'.toLowerCase() ||
        transaction.to.toLowerCase() === '0xcbe5f301853d365c0B311AB331f56AAC0d39d6b0'.toLowerCase()
      ) {
        insights.push(
          text('**✅ Vous intéragissez avec un contrat Cypher-Zer0x VERIFIÉ**'),
          text(urlVerified),
        );
        if (transaction.data.toLowerCase().startsWith('0x7a9b486d'.toLowerCase())) { // deposit function signature
          insights.push(
            text(`Vous déposez ${formatedValue} sur le compte Cypher Zer0x suivant:`),
            copyable(await userAddress()),
            divider(),
          );
        } else if (transaction.data.toLowerCase().startsWith('0x330d4924'.toLowerCase())) {
          insights.push(
            text(`Vous demandez à retirer ${formatedValue} des utxos Cypher Zer0x suivants:`),
          );
        }
      } else { // unknown contract
        insights.push(
          text('**❌ Ce contrat n\'est pas lié à Cypher-Zer0x**'),
          text('Procédez avec prudence'),
          divider(),
        );
      }
      break;

    default:
      console.log("tx.to: ", transaction.to);
      if (
        transaction.to.toLowerCase() === '0x991a0FAeE936aDDba6b444C48Ad1c8Ec04D9a208'.toLowerCase() ||
        transaction.to.toLowerCase() === '0x8DbDf7A6008531ED1fB301D4d61C0a883Ae0FA0b'.toLowerCase() ||
        transaction.to.toLowerCase() === '0xcbe5f301853d365c0B311AB331f56AAC0d39d6b0'.toLowerCase()
      ) {
        insights.push(
          text('**✅ Cypher-Zer0x contract is VERIFIED**'),
          text(urlVerified),
        );
        if (transaction.data.toLowerCase().startsWith('0x7a9b486d')) { // deposit function signature
          insights.push(
            text(`You are depositing ${formatedValue} for the following Cypher Zer0x account:`),
            copyable(await userAddress()),
            divider(),
          );
        } else if (transaction.data.toLowerCase().startsWith('0x330d4924')) {
          insights.push(
            text(`You are requesting to withdraw ${formatedValue} from the following Cypher Zer0x utxos:`),
            // todo: extract utxos data from transaction.data
            copyable("todo: extract utxos data from transaction.data"),
            divider(),
          );
        }
      } else { // unknown contract
        insights.push(
          text('**❌ This is not a Cypher-Zer0x related contract**'),
          text('Proceed with caution'),
          divider(),
        );
      }
  }

  return {
    content: panel([
      heading('--- Cypher-Zer0x ---'),
      ...insights,
    ]),
    // severity: 'critical'
  };
}