import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import Login from './Login';
import MembersTable from './MembersTable';
import TransactionsTable from './TransactionsTable'

class App extends React.Component {
	constructor(props) {
		super(props);
		// let init = JSON.parse('{"members":[{"member_id":1,"name":"Rick"},{"member_id":2,"name":"Morty"},{"member_id":3,"name":"Summer"},{"member_id":4,"name":"Beth"},{"member_id":5,"name":"Jerry"}],"transactions":[{"trans_id":1,"type":0,"name":"Costco","date":"2016-09-11","amount":160,"liabilities":[{"creditor":4,"debtor":1,"amount":40},{"creditor":4,"debtor":2,"amount":40},{"creditor":4,"debtor":3,"amount":40}]},{"trans_id":2,"type":0,"name":"McDonalds","date":"2016-09-12","amount":30,"liabilities":[{"creditor":2,"debtor":5,"amount":10},{"creditor":2,"debtor":3,"amount":10}]},{"trans_id":3,"type":0,"name":"Walmart","date":"2016-09-15","amount":50,"liabilities":[{"creditor":5,"debtor":1,"amount":20},{"creditor":5,"debtor":2,"amount":10},{"creditor":5,"debtor":3,"amount":10}]},{"trans_id":4,"type":0,"name":"Five Guys","date":"2016-09-16","amount":40,"liabilities":[{"creditor":4,"debtor":5,"amount":20}]},{"trans_id":5,"type":0,"name":"Dining Table - IKEA","date":"2016-09-17","amount":300,"liabilities":[{"creditor":1,"debtor":2,"amount":60},{"creditor":1,"debtor":3,"amount":60},{"creditor":1,"debtor":4,"amount":60},{"creditor":1,"debtor":5,"amount":60}]}],"transfers":[{"from":3,"to":1,"amount":120},{"from":2,"to":4,"amount":80},{"from":2,"to":1,"amount":10},{"from":5,"to":1,"amount":50}]}');
		// console.log(init);
		this.state = {
			data: {
				members: [],
				transactions: [],
				// members: init.members,
				// transactions: init.transactions,
				transfers:[]
			},
			loggedIn: false,
			notifMessage: ''
		};
		
 		this.initialize = this.initialize.bind(this);
		this.logout = this.logout.bind(this);
		this.addFn = this.addFn.bind(this);
	}
		
	initialize() {
		console.log('login success');
		console.log(sessionStorage.getItem('token'));
		
		
		axios.post('http://localhost:3000/secure/initialize', {
			token: sessionStorage.getItem('token')
		})
		.then((res) => {
			this.setState({data: res.data, loggedIn: true});
		})
		.catch((err) => {
			this.setState({notifMessage: 'Problem fetching initial data from server.'});
			console.log(err);
		});
	}
	
	logout() {
		sessionStorage.removeItem('token');
		this.setState({loggedIn: false});
	}
	
	addFn(data) {
		console.log(data);
	}
	
	removeFn(data) {
		console.log(data);
	}
	
	render() {
		if (!this.state.loggedIn){
			return (
				<Login loginSuccess={this.initialize}/>
			)
		} else {
			return (
				<div className="container">
					<button onClick={this.logout} className="button is-danger">Sign Out</button>
					<MembersTable data={this.state.data.members} addFn={this.addFn} removeFn={this.removeFn}/>
					<TransactionsTable data={this.state.data.transactions} addFn={this.addFn} members={this.state.data.members} removeFn={this.removeFn} />
				</div>
			)
		}
	}
}

const Notification = (props) => {
	return (
		<div className="notification is-warning">
		{props.message}
		</div>
	)
}

ReactDOM.render(
	<App />,
	document.getElementById('app')
)

export default App
