// src/UserDashboard.tsx

function UserDashboard() {
  return (
    <div className="card">
      <h2 className="card-title">User Dashboard</h2>
      <p>Protect your agent by subscribing to the Naughty Agents protocol.</p>
      <div className="button-group">
        <button className="button" onClick={() => console.log("Subscribe clicked")}>
          Subscribe
        </button>
        <button className="button" onClick={() => console.log("Deploy clicked")}>
          Deploy Secure Wallet
        </button>
      </div>
    </div>
  );
}

export default UserDashboard;
