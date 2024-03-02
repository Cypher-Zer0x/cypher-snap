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

48899 : , // Zircuit Testnet
2525 : , // Injective Testnet
9090 : , // Inco Gentry Testnet
80001 : Mumbai_QR_Code, // Mumbai Testnet
11155111 : , // Sepolia
59140 : , // Linea Testnet
1313161555 : , // Aurora Testnet
51 : , // XDC Testnet
23295 : , // Oasis Testnet
296 : , // Hedera Testnet
1287 : , // Moonbase Alpha

*/
export const onTransaction: OnTransactionHandler = async ({
  transaction,
  chainId,
  transactionOrigin,
}) => {
  console.log('Transaction received:', transaction, chainId, transactionOrigin)

  let insights: any[] = [];
  switch (await locale()) {
    case 'fr':
      if (
        transaction.to === '0xF43a5fCa550a8b04252ADd7520caEd8dde85e449' ||
        transaction.to === '0xBFA33B098a0904e362eFf7850C63d30cbd2Ff797'
      ) {
        insights.push(
          text('**✅ Vous intéragissez avec un contrat Cypher-Zer0x VERIFIÉ**'),
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