import type { OnInstallHandler } from '@metamask/snaps-sdk';
import { button, divider, heading, panel, text } from '@metamask/snaps-sdk';

export const onInstall: OnInstallHandler = async () => {
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
};