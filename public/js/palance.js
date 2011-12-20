var socket = io.connect('http://localhost:8080');

$(function(){
	$("#query_form").submit(function(){
		socket.emit('query', {id: new_query_id(), query: $("#query").val()});
		return false;
	});

});

function new_query_id () {
	if (!this.next_id) {
		this.next_id=1;
	}
	return this.next_id++;
}

var $results = $(".content .query-results");
var results_buffer = {};

function log_signal(signal) {
	socket.on(signal, function (data) {
		console.log(signal, data);
	});
}

socket.on('query-row', function (data) {
	if (!results_buffer[data.id]) {
		var headers = '<tr>';

		_.each(data.row, function(val, prop) {
			headers += "<th>" + prop + "</th>";
		});

		headers += '</tr>';

		results_buffer[data.id] = [headers];
	}

	var markup = "<tr>";

	_.each(data.row, function(val, prop) {
		markup += "<td>" + val + "</td>";
	});

	markup += "</tr>";

	results_buffer[data.id].push(markup);
});

socket.on('query-end', function (data) {
	var table = '<table class="bordered-table zebra-striped">' + results_buffer[data.id].join('') + "</table>";
	$results.append(table);
});

log_signal('query-error');
