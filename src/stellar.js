import {
  isConnected,
  requestAccess,
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
  const conn = await isConnected();
  if (!conn.isConnected) {
    throw new Error('Freighter is not connected. Please install Freighter.');
  }
  const { address, error } = await requestAccess();
  if (error) {
    throw new Error(error);
  }
  return address;
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

  const { signedTxXdr, error } = await signTransaction(transaction.toXDR(), {
    networkPassphrase,
  });

  if (error) {
    throw new Error(error);
  }

  const result = await server.submitTransaction(
    TransactionBuilder.fromXDR(signedTxXdr, networkPassphrase)
  );

  return result;
}
