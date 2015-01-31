window.onload = function() {

	var messages = [];
	var socket = io.connect('http://localhost:3700');
	var field = document.getElementById("field");
	var chatButton = document.getElementById("chat_button");
	var chatbox = $("#chatbox");
	var sendButton = document.getElementById("send");
	var content = document.getElementById("chatbox");
	var myName = 'Server', mylang = 'en', learning;
	var room;

	socket.on('message', function (data) {
		if(data.message) {
			messages.push(data);
			var chatbox = $('#chatbox');
			if (data.mylang === mylang && data.username != myName && data.username != 'Server') {
				chatbox.append("<span class='chatter_msg_item " + (data.username === myName ? 'chatter_msg_item_me' : 'chatter_msg_item_other') + "'> <strong>" + (data.username ? data.username : 'Server') + ': </strong>' + data.message + '</span><br />');
			} else if (data.mylang != mylang || data.username === 'Server') {
				socket.emit('to_trans', { message: data.message, username: data.username, from: data.mylang, to: mylang, room: room});
			} else if (data.username === myName) {
				socket.emit('to_trans', { message: data.message, username: myName, from: mylang, to: data.mylang, room: room });
			} 
		} else {
			console.log("There is a problem:", data);
		}
		chatbox.scrollTop(chatbox.get(0).scrollHeight);
	});

	socket.on('translated', function (translation) {
		if (translation.origMessage.replace(/(\r\n|\n|\r)/gm,"") != translation.message) {
			chatbox.append("<span class='chatter_msg_item " + (translation.username === myName ? 'chatter_msg_item_me' : 'chatter_msg_item_other') + "'> <strong>" + translation.username + ': </strong>' + translation.origMessage + ' -> ' + translation.message + '</span><br />');
		}
	});

	socket.on('joined room', function (data) {
		room = data.room;
		chatbox.append("<span class='chatter_msg_item chatter_msg_item_other'><strong>Server: </strong>Please wait as we find a match for you...</span><br />");
	});

	sendButton.onclick = sendMessage = function() {
		if(name.value == "") {
			alert("Please type your name!");
		} else {
			var text = field.value;
			socket.emit('send', { message: text, username: myName, mylang: mylang, room: room });
			field.value = "";
		}
	};

	chatButton.onclick = startChat = function() {
		if($('#name').val() == "") {
			alert("Please type your name!");
		} else {
			$('#languages').hide();
			$('#chatarea').fadeIn();

			myName = $('#name').val();
			mylang = $('.mylang .dropdown-select').val();
			learning = $('.learning .dropdown-select').val();
  			socket.emit('enter room', { username: myName, mylang: mylang, learning: learning });
		}
	}; 
}

$(document).ready(function() {
	$("#field").keyup(function(e) {
		if(e.keyCode == 13) {
			sendMessage();
		}
	});
	$("#name").keyup(function(e) {
		if(e.keyCode == 13) {
			startChat();
		}
	});
});
