import React from 'react';
import axios from 'axios';

const MembersTable = (props) => {
	let rows = props.data.map((element) => {
		return <MemberRow key={element.member_id} data={element} removeFn={props.removeFn}/>
	})
	
	return (
		<table className="table is-bordered">
			<thead>
				<tr>
					<th>Name</th>
					<th>Action</th>
				</tr>
			</thead>
			<tbody>
				{rows}
				<AddMember addFn={props.addFn}/>
			</tbody>
		</table>
	)
}

class MemberRow extends React.Component {
	constructor(props){
		super(props);
		this.handleRemove = this.handleRemove.bind(this);
	}
	
	handleRemove() {
		this.props.removeFn({
			member: this.props.data.member_id
		})
	}

	render() {
		return (
			<tr>
				<td>{this.props.data.name}</td>
				<td><button className="button" onClick={this.handleRemove}>X</button></td>
			</tr>
		)
	}
}

class AddMember extends React.Component {
	constructor(props){
		super(props);
		this.state = {memName: ''};
		this.handleChange = this.handleChange.bind(this);
		this.handleClick = this.handleClick.bind(this);
	}
	
	handleChange (event) {
		this.setState({
			[event.target.id]: event.target.value
		});
	}
	
	handleClick (event) {
		if (this.state.addName){
			this.props.addFn({
				member: {
					name: this.state.addName
				}
			})
		}
	}
	
	render() {
		return (
			<tr>
				<td><input className="input" id="memName" type="text" value={this.state.addName} onChange={this.handleChange} placeholder="Name" /></td>
				<td><button className="button" onClick={this.handleClick}>Add</button></td>
			</tr>
		)
	}
}

export default MembersTable;
