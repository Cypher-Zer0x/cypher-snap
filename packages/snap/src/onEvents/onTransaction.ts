import { panel, heading, text, copyable, divider } from '@metamask/snaps-ui';
import { OnTransactionHandler } from '@metamask/snaps-sdk';
import { locale, userAddress } from '../keys';

/*
plasma mumbai : 0xF43a5fCa550a8b04252ADd7520caEd8dde85e449
Plasma Linea : 0xBFA33B098a0904e362eFf7850C63d30cbd2Ff797
Plasma hedera : 0xBFA33B098a0904e362eFf7850C63d30cbd2Ff797
Plasma zircuit : 0xBFA33B098a0904e362eFf7850C63d30cbd2Ff797
Plasma XDC: 0xBFA33B098a0904e362eFf7850C63d30cbd2Ff797
Plasma aurora : 0xBFA33B098a0904e362eFf7850C63d30cbd2Ff797
Plasma sepolia : 0xF43a5fCa550a8b04252ADd7520caEd8dde85e449
Plasma oasis : 0xBFA33B098a0904e362eFf7850C63d30cbd2Ff797
*/

export const onTransaction: OnTransactionHandler = async ({
  transaction,
  chainId,
  transactionOrigin,
}) => {
  let urlVerified = 'Origin URL is unknown';
  if (transactionOrigin !== undefined && transactionOrigin !== null) {
    console.log("transactionOrigin: ", transactionOrigin);
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


  let insights: any[] = [];
  switch (await locale()) {
    case 'fr':
      if (
        transaction.to === '0xF43a5fCa550a8b04252ADd7520caEd8dde85e449' ||
        transaction.to === '0xBFA33B098a0904e362eFf7850C63d30cbd2Ff797'
      ) {
        insights.push(
          text('**✅ Vous intéragissez avec un contrat Cypher-Zer0x VERIFIÉ**'),
          text(urlVerified),
        );
        if (transaction.data.startsWith('0x7a9b486d')) { // deposit function signature
          insights.push(
            text(`Vous déposez ${transaction.value} sur le compte Cypher Zer0x suivant:`),
            copyable(await userAddress()),
            divider(),
          );
        } else if (transaction.data.startsWith('0x330d4924')) {
          insights.push(
            text(`Vous demandez à retirer ${transaction.value} des utxos Cypher Zer0x suivants:`),
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
      if (
        transaction.to === '0xF43a5fCa550a8b04252ADd7520caEd8dde85e449' ||
        transaction.to === '0xBFA33B098a0904e362eFf7850C63d30cbd2Ff797'
      ) {
        insights.push(
          text('**✅ Cypher-Zer0x contract is VERIFIED**'),
          text(urlVerified),
        );
        if (transaction.data.startsWith('0x7a9b486d')) { // deposit function signature
          insights.push(
            text(`You are depositing ${transaction.value} for the following Cypher Zer0x account:`),
            copyable(await userAddress()),
            divider(),
          );
        } else if (transaction.data.startsWith('0x330d4924')) {
          insights.push(
            text(`You are requesting to withdraw ${transaction.value} from the following Cypher Zer0x utxos:`),
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