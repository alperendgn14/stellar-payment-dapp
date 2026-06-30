import { useState, useCallback } from 'react';
import { connectWallet, getBalance, sendXLM } from './stellar';
import './App.css';

function App() {
  const [publicKey, setPublicKey] = useState(null);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState(null);

  const [destination, setDestination] = useState('');
  const [amount, setAmount] = useState('');

  const handleConnect = useCallback(async () => {
    setLoading(true);
    setTxStatus(null);
    try {
      const key = await connectWallet();
      setPublicKey(key);
      const bal = await getBalance(key);
      setBalance(bal);
    } catch (err) {
      setTxStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDisconnect = useCallback(() => {
    setPublicKey(null);
    setBalance(null);
    setTxStatus(null);
    setDestination('');
    setAmount('');
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!publicKey) return;
    try {
      const bal = await getBalance(publicKey);
      setBalance(bal);
    } catch {
      setBalance(null);
    }
  }, [publicKey]);

  const handleSend = useCallback(
    async (e) => {
      e.preventDefault();
      if (!publicKey || !destination || !amount) return;
      setLoading(true);
      setTxStatus(null);
      try {
        const result = await sendXLM({
          destination,
          amount,
          publicKey,
        });
        setTxStatus({
          type: 'success',
          message: 'Transaction sent successfully!',
          hash: result.hash,
        });
        setDestination('');
        setAmount('');
        await refreshBalance();
      } catch (err) {
        setTxStatus({
          type: 'error',
          message: err.response?.data?.detail || err.message || 'Transaction failed',
        });
      } finally {
        setLoading(false);
      }
    },
    [publicKey, destination, amount, refreshBalance]
  );

  const shortKey = publicKey
    ? `${publicKey.slice(0, 6)}...${publicKey.slice(-4)}`
    : '';

  const testnetFaucetUrl = `https://laboratory.stellar.org/#account-creator?network=testnet`;

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <span className="logo-icon">✦</span>
          <h1>Stellar Pay</h1>
        </div>
        <p className="subtitle">Testnet Payment dApp</p>
      </header>

      <main className="main">
        {!publicKey ? (
          <section className="card connect-card">
            <div className="card-icon">🔌</div>
            <h2>Connect Your Wallet</h2>
            <p>Connect your Freighter wallet to get started on Stellar Testnet.</p>
            <button
              className="btn btn-primary"
              onClick={handleConnect}
              disabled={loading}
            >
              {loading ? 'Connecting...' : 'Connect Freighter'}
            </button>
            <p className="hint">
              Don't have Freighter?{' '}
              <a href="https://freighter.app" target="_blank" rel="noreferrer">
                Install it here
              </a>
            </p>
          </section>
        ) : (
          <>
            <section className="card wallet-card">
              <div className="wallet-header">
                <div className="wallet-info">
                  <span className="badge">Connected</span>
                  <h2>Wallet</h2>
                  <code className="address">{shortKey}</code>
                  <div className="balance-display">
                    <span className="balance-label">Balance</span>
                    <span className="balance-value">
                      {balance !== null ? `${parseFloat(balance).toFixed(2)} XLM` : '---'}
                    </span>
                  </div>
                </div>
                <div className="wallet-actions">
                  <button className="btn btn-secondary" onClick={refreshBalance}>
                    Refresh
                  </button>
                  <button className="btn btn-danger" onClick={handleDisconnect}>
                    Disconnect
                  </button>
                </div>
              </div>
            </section>

            <section className="card send-card">
              <h2>Send XLM</h2>
              <form onSubmit={handleSend}>
                <div className="form-group">
                  <label htmlFor="destination">Destination Address</label>
                  <input
                    id="destination"
                    type="text"
                    placeholder="G... or testnet address"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="amount">Amount (XLM)</label>
                  <input
                    id="amount"
                    type="number"
                    step="0.0000001"
                    min="0"
                    placeholder="0.0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary btn-full"
                  disabled={loading || !destination || !amount}
                >
                  {loading ? 'Sending...' : 'Send XLM'}
                </button>
              </form>
            </section>

            {txStatus && (
              <section className={`card status-card ${txStatus.type}`}>
                <div className="status-header">
                  <span className="status-icon">
                    {txStatus.type === 'success' ? '✓' : '✗'}
                  </span>
                  <span>{txStatus.message}</span>
                </div>
                {txStatus.hash && (
                  <div className="tx-hash">
                    <span>Tx Hash: </span>
                    <code>{txStatus.hash}</code>
                  </div>
                )}
              </section>
            )}

            <section className="card faucet-card">
              <h3>Need testnet XLM?</h3>
              <p>
                Use the{' '}
                <a href={testnetFaucetUrl} target="_blank" rel="noreferrer">
                  Stellar Laboratory Faucet
                </a>{' '}
                to fund your account.
              </p>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
