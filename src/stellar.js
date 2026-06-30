import {
  isConnected,
  getPublicKey,
  signTransaction,
} from '@stellar/freighter-api';
import {
  Networks,
  TransactionBuilder,
  Asset,
  Operation,
  BASE_FEE,
  Horizon,
} from '@stellar/stellar-sdk';

const server = new Horizon.Server('https://horizon-testnet.stellar.org');
const networkPassphrase = Networks.TESTNET;

export async function connectWallet() {
  const connected = await isConnected();
  if (!connected) {
    throw new Error('Freighter is not connected. Please install Freighter.');
  }
  const publicKey = await getPublicKey();
  return publicKey;
}

export async function getBalance(publicKey) {
  const account = await server.loadAccount(publicKey);
  const xlmBalance = account.balances.find((b) => b.asset_type === 'native');
  return xlmBalance ? xlmBalance.balance : '0';
}

export async function sendXLM({ destination, amount, publicKey }) {
  const account = await server.loadAccount(publicKey);

  const transaction = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(
      Operation.payment({
        destination,
        asset: Asset.native(),
        amount: amount.toString(),
      })
    )
    .setTimeout(30)
    .build();

  const signedXDR = await signTransaction(transaction.toXDR(), {
    networkPassphrase,
  });

  const result = await server.submitTransaction(
    TransactionBuilder.fromXDR(signedXDR, networkPassphrase)
  );

  return result;
}
