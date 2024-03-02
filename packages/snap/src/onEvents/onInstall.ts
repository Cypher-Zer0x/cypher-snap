import type { OnInstallHandler } from '@metamask/snaps-sdk';
import { button, divider, heading, panel, text } from '@metamask/snaps-sdk';
import { locale } from '../keys';

export const onInstall: OnInstallHandler = async () => {
  switch (await locale()) {
    case "fr":
      await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'alert',
          content: panel([
            heading('Cypher Zer0x'),
            text("Récupérez votre vie privée"),
            divider(),
            text(
              'Une solution Layer 2 Zero Knowledge cross-chain conçue pour les transactions privées tout en garantissant la conformité aux réglementations. Utilisant la technologie ZK et les signatures en anneau, nous vous offrons une blockchain sécurisée et confidentielle au dessus de tous les réseaux blockchain.',
            ),
            divider(),
            text('Cette solution open source est propulsée par [Cypher Lab 🔗](https://www.cypherlab.org/)'),
            button({ value: 'Commencer', name: 'go-home', variant: 'primary' }),
          ]),
        },
      });
      break;

    default:
      await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'alert',
          content: panel([
            heading('Cypher Zer0x'),
            text("Bring privacy back"),
            divider(),
            text(
              'A cross-chain, ZK Layer 2 solution designed for private transactions while ensuring compliance with regulatory standards. Utilizing zero-knowledge technology and ring signatures, we offers a secure and confidential platform for transactions across various blockchain networks. ',
            ),
            divider(),
            text('This open source solution is Powered by [Cypher Lab 🔗](https://www.cypherlab.org/)'),
            button({ value: 'Get Started', name: 'go-home', variant: 'primary' }),
          ]),
        },
      });
    }
  };