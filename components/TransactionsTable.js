import React from 'react';
import axios from 'axios';

const TransactionsTable = (props) => {
	let rows = props.data.map((element) => {
		console.log(element);
		return <TransactionRow key={element.trans_id} data={element} removeFn={props.removeFn}/>
	})
	
	return (
		<table className="table is-bordered">
			<thead>
				<tr>
					<th>Date</th>
					<th>Name</th>
					<th>Amount</th>
					<th>Action</th>
				</tr>
			</thead>
			<tbody>
				{rows}
				<AddTransaction members={props.members} addFn={props.addFn}/>
			</tbody>
		</table>
	)
}

class TransactionRow extends React.Component {
	constructor(props){
		super(props);
		this.handleRemove = this.handleRemove.bind(this);
	}
	
	handleRemove() {
		this.props.removeFn({
			transaction: this.props.data.trans_id
		})
	}

	render() {
		return (
			<tr>
				<td>{this.props.data.date}</td>
				<td>{this.props.data.name}</td>
				<td>{this.props.data.amount}</td>
				<td><button className="button" onClick={this.handleRemove}>X</button></td>
			</tr>
		)
	}
}

class AddTransaction extends React.Component {
	constructor(props){
		super(props);
		this.state = {trName: '', trDate:'', trAmount: '', trSplit: ''};
		this.handleChange = this.handleChange.bind(this);
		this.handleClick = this.handleClick.bind(this);
		this.handleSplit = this.handleSplit.bind(this);
	}
	
	handleChange (event) {
		this.setState({
			[event.target.id]: event.target.value
		});
	}
	
	handleClick (event) {
		if (this.state.trDate && this.state.trName && this.state.trAmount && this.state.trAmount > 0){
			this.props.addFn({
				transaction: {
					date: this.state.trDate,
					name: this.state.trName,
					amount: this.state.trAmount
				}
			})
		}
	}
	
	handleSplit (event) {
		let text = this.state.trSplit;
		text += `${e.name}(${e.amount}) `;
		this.setState({trSplit: text});
	}
	
	render() {
		return (
			<tr>
				<td><input className="input" id="trDate" type="date" value={this.state.trDate} onChange={this.handleChange} placeholder="Date" /></td>
				<td><input className="input" id="trName" type="text" value={this.state.trName} onChange={this.handleChange} placeholder="Name" /></td>
				<td><input className="input" id="trAmount" type="number" value={this.state.trAmount} onChange={this.handleChange} placeholder="Amount" /></td>
				<td><button className="button" onClick={this.handleClick}>Add</button></td>
			</tr>
		)
	}
}

export default TransactionsTable;
