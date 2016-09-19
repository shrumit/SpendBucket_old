import React from 'react';
import axios from 'axios';

class Login extends React.Component {
	
	getDefaultState() {
		return {
			username: 'demo',
			password: 'pass',
			message: ''
		}
	}
	
	constructor(props) {
		super(props);
		this.state = this.getDefaultState();
		this.handleChange = this.handleChange.bind(this);
		this.login = this.login.bind(this);
	}
	
	handleChange (event) {
		this.setState({
			[event.target.id]: event.target.value
		});
	}
	
	login(event) {
		event.preventDefault();
		console.log('login');
		if (this.state.username && this.state.password) {
			axios.post('http://localhost:3000/auth', {
				username: this.state.username,
				password: this.state.password
			})
			.then((res) => {
				if (res.status === 200 && res.data.token){
					sessionStorage.setItem('token', res.data.token);
					this.props.loginSuccess();
				}
			})
			.catch((err) => {
				console.log('login axios error');
				if (this.setState){
					this.setState({message: 'Login failed'});
				}
			});
		}
	}
	
	render (){
		return (
			<div className="box column is-half is-offset-one-quarter">
				<h2>Sign In</h2>
				<input className="input" id="username" type="text" value={this.state.username} onChange={this.handleChange} placeholder="Username" />
				<input className="input" id="password" type="password" value={this.state.password} onChange={this.handleChange} placeholder="Password" />
				<button className="button" onClick={this.login}>Submit</button>
				<p>{this.state.message}</p>
			</div>
		)
	}
}

export default Login;
