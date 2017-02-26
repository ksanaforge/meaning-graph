// set up SVG for D3
var width = left.clientWidth, height = 500, colors = d3.scale.category10(),
	svg = d3.select('svg').attr('oncontextmenu', 'return false;')
	.attr('width', width).attr('height', height),
// set up initial nodes and links
//  - nodes are known by 'id', not by index in array.
//  - reflexive edges are indicated on the node (as a bold black circle).
//  - links are set by source 'left' and target 'right'.
	codeid = localStorage.codeid||'workingGraph',
	graph = JSON.parse(localStorage.code||'{"nodes":\n'+
	' [{"id":0,"reflexive":false,"color":"#1f77b4"}\n'+
	' ,{"id":1,"reflexive":true,"color":"#ff7f0e"}\n'+
	' ,{"id":2,"reflexive":false,"color":"#2ca02c"}\n'+
	' ], "lastNodeId": 2,\n'+
	' "links":\n'+
	' [{"source":0,"target":1,"left":false,"right":true}\n'+
	' ,{"source":1,"target":2,"left":false,"right":true}\n'+
	' ]\n'+
	'}'),
	nodes = graph.nodes,
	lastNodeId = graph.lastNodeId,
	links = graph.links,
// init D3 force layout
	force = d3.layout.force() .nodes(nodes).links(links)
    .size([width, height]).linkDistance(150).charge(-800).on('tick', tick),
// line displayed when dragging new nodes
	drag_line = svg.append('svg:path')
	.attr('class', 'link dragline hidden').attr('d', 'M0,0L0,0'),
// handles to link and node element groups
	path = svg.append('svg:g').selectAll('path'),
    circle = svg.append('svg:g').selectAll('g'),
// mouse event vars
	selected_node = selected_link =
	mousedown_link = mousedown_node = mouseup_node = null;
if(codeId.value != codeid)
	codeId.value = codeid;
// define arrow markers for graph links
svg.append('svg:defs').append('svg:marker').attr('id', 'end-arrow')
	.attr('viewBox', '0 -5 10 10').attr('refX', 6)
	.attr('markerWidth', 3).attr('markerHeight', 3).attr('orient', 'auto')
  .append('svg:path')
    .attr('d', 'M0,-5L10,0L0,5').attr('fill', '#000');
svg.append('svg:defs').append('svg:marker').attr('id', 'start-arrow')
    .attr('viewBox', '0 -5 10 10').attr('refX', 4)
    .attr('markerWidth', 3).attr('markerHeight', 3).attr('orient', 'auto')
  .append('svg:path')
    .attr('d', 'M10,-5L0,0L10,5').attr('fill', '#000');
function resetMouseVars() {
	mousedown_link = mousedown_node = mouseup_node = null; }
// update force layout (called automatically each iteration)
function tick() {
	// draw directed edges with proper padding from node centers
	path.attr('d', function(d) {
		var x1 = d.source.x, y1 = d.source.y,
			x2 = d.target.x, y2 = d.target.y,
			a = Math.atan2(y2 - y1, x2 - x1),
		    normX = Math.cos(a), normY = Math.sin(a),
		    sourcePadding = d.left  ? 17 : 12,
		    targetPadding = d.right ? 17 : 12,
		    sourceX = x1 + (sourcePadding * normX),
		    sourceY = y1 + (sourcePadding * normY),
		    targetX = x2 - (targetPadding * normX),
		    targetY = y2 - (targetPadding * normY);
		return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY;
	});
	circle.attr('transform', function(d) {
		return 'translate(' + d.x + ',' + d.y + ')';
	});
}
// update graph (called when needed)
function loadGraph(){
	debugger
    firebase.database().ref('sam/'+codeId.value)
    .on('value',function(snapshot){
		firebase.database().ref('sam/'+codeId.value).off('value');
    	if(! snapshot){
    		alert('snapshot:'+snapshot);
    		return;
    	}
	var sv=snapshot.val() || '{"code":{}}';
		graph = JSON.parse(sv.code);
		nodes = graph.nodes || [];
		lastNodeId = graph.lastNodeId || -1;
		links = graph.links || [];
		var getNodeById = {};
		nodes.forEach(function(N){
			getNodeById[N.id]=N;
		});
		links.forEach(function(L){
			L.source = getNodeById[L.source];
			L.target = getNodeById[L.target];
		});
		force.nodes(nodes).links(links);
		restart();
    }.bind(this));
}
function saveGraph(){
    firebase.database().ref('sam/'+codeId.value)
    .set({ username: 'sam', code:code.value });
}
function onChangeCode  (){
	localStorage.code  =code  .value; }
function onChangeCodeId(){
	localStorage.codeid=codeId.value; }
function myColor(d){ return d.color?d.color:colors(d.id); } 
function restart() {
	code.value=localStorage.code='{"nodes":\n ['+
	    nodes.map(function(N){
	    	return '{"id":'+N.id+',"reflexive":'+(N.reflexive||false)+
	      		',"color":"'+myColor(N)+'"}'
	    }).join('\n ,')+'\n ], "lastNodeId": '+lastNodeId+',\n "links":\n ['+
	    links.map(function(L){
	    	var sid=L.source, tid=L.target;
	    	if(isNaN(sid)) sid=sid.id;
	    	if(isNaN(tid)) tid=tid.id;
	    	return '{"source":'+sid+',"target":'+tid+
	      		',"left":'+L.left+',"right":'+L.right+'}'
	    }).join('\n ,')+'\n ]\n}';
	// path (link) group
	path = path.data(links);
	// update existing links
	path.classed('selected', function(d) {
		return d === selected_link; })
	.style('marker-start', function(d) {
		return d.left  ? 'url(#start-arrow)' : ''; })
	.style('marker-end', function(d) {
		return d.right ? 'url(#end-arrow)'   : ''; });
	// add new links
	path.enter().append('svg:path')
	.attr('class', 'link')
	.classed('selected', function(d) {
		return d === selected_link; })
	.style('marker-start', function(d) {
		return d.left ? 'url(#start-arrow)' : ''; })
	.style('marker-end', function(d) {
		return d.right ? 'url(#end-arrow)' : ''; })
	.on('mousedown', function(d) {
		if(d3.event.ctrlKey) return;
		// select link
		mousedown_link = d;
		selected_link = d === selected_link ? null : d;
		if (selected_link)
			selected_node = null;
		restart();
	});
	// remove old links
	path.exit().remove();
	// circle (node) group
	// NB: the function arg is crucial here! nodes are known by id, not by index!
	circle = circle.data(nodes, function(d) {
		return d.id; });
	// update existing nodes (reflexive & selected visual states)
	circle.selectAll('circle')
	.style('fill', function(d) {
		var c = colors(d.id);
		return (d === selected_node) ? d3.rgb(c).brighter().toString() : c; })
	.classed('reflexive', function(d) {
		return d.reflexive; });
	// add new nodes
	var g = circle.enter().append('svg:g');
	g.append('svg:circle')
	.attr('class', 'node')
	.attr('r', 12)
	.style('fill', function(d) {
		var c = colors(d.id);
		return (d === selected_node) ? d3.rgb(c).brighter().toString() : c; })
	.style('stroke', function(d) {
		return d3.rgb(colors(d.id)).darker().toString(); })
	.classed('reflexive', function(d) {
		return d.reflexive; })
	.on('mouseover', function(d) {
		if(!mousedown_node || d === mousedown_node) return;
		// enlarge target node
		d3.select(this).attr('transform', 'scale(1.1)'); })
	.on('mouseout', function(d) {
		if(!mousedown_node || d === mousedown_node) return;
		// unenlarge target node
		d3.select(this).attr('transform', ''); })
	.on('mousedown', function(d) {
		if(d3.event.ctrlKey) return;
		// select node
		mousedown_node = d;
		selected_node = selected_node === d ? null : d;
		// reposition drag line
		if (selected_node) selected_link = null;
		drag_line
		.style('marker-end', 'url(#end-arrow)')
		.classed('hidden', false)
		.attr('d', 'M' + d.x + ',' + d.y + 'L' + d.x + ',' + d.y);
		restart();
	})
	.on('mouseup', function(d) {
		if(!mousedown_node) return;
		// needed by FF
		drag_line
		.classed('hidden', true)
		.style('marker-end', '');
		// check for drag-to-self
		mouseup_node = d;
		if(mouseup_node === mousedown_node) {
			resetMouseVars(); return; }
		// unenlarge target node
		d3.select(this).attr('transform', '');
		// add link to graph (update if exists)
		// NB: links are strictly source < target; arrows specified by booleans
		var source, target, direction;
		if(mousedown_node.id < mouseup_node.id) {
			source = mousedown_node, target = mouseup_node;
			direction = 'right';
		} else {
			target = mousedown_node, source = mouseup_node;
			direction = 'left';
		}
		var link;
		link = links.filter(function(l) {
			return (l.source === source && l.target === target);
		})[0];
		if(link) link[direction] = true;
		else {
			link = {source, target, left: false, right: false};
			link[direction] = true;
			links.push(link);
		}
		// select new link
		selected_link = link, selected_node = null;
		restart();
	});
	// show node IDs
	g.append('svg:text')
	.attr('x', 0).attr('y', 4).attr('class', 'id')
	.text(function(d) { return d.id; });
	// remove old nodes
	circle.exit().remove();
	// set the graph in motion
	force.start();
}
function mousedown() {
	// prevent I-bar on drag
	//d3.event.preventDefault();
	// because :active only works in WebKit?
	svg.classed('active', true);
	if(d3.event.ctrlKey || mousedown_node || mousedown_link) return;
	// insert new node at point
	var point = d3.mouse(this), x = point[0], y = point[1];
		node = {id: ++lastNodeId, reflexive: false, x, y};
	nodes.push(node);
	restart();
}
function mousemove() {
	if(!mousedown_node) return;
	// update drag line
	var point = d3.mouse(this),
		x1 = mousedown_node.x, x2 = point[0],
		y1 = mousedown_node.y, y2 = point[1];
	drag_line.attr('d', 'M' + x1 + ',' + y1 + 'L' + x2 + ',' + y2);
	restart();
}
function mouseup() {
	if(mousedown_node) {
		// hide drag line
		drag_line.classed('hidden', true).style('marker-end', '');
	}
	// because :active only works in WebKit?
	svg.classed('active', false);
	// clear mouse event vars
	resetMouseVars();
}
function spliceLinksForNode(node) {
	var toSplice = links.filter(function(l) {
		return (l.source === node || l.target === node); });
	toSplice.map(function(l) {
		links.splice(links.indexOf(l), 1); });
}
// only respond once per keydown
var lastKeyDown = -1;
function keydown() {
	d3.event.preventDefault();
	if(lastKeyDown !== -1) return;
	lastKeyDown = d3.event.keyCode;
	if(d3.event.keyCode === 17) { // ctrl
		circle.call(force.drag);
		svg.classed('ctrl', true); }
	if(!selected_node && !selected_link) return;
	switch(d3.event.keyCode) {
	case 8: // backspace
	case 46: // delete
		if(selected_node) {
			nodes.splice(nodes.indexOf(selected_node), 1);
			spliceLinksForNode(selected_node); } 
		else if(selected_link) {
			links.splice(links.indexOf(selected_link), 1); }
		selected_node = selected_link = null;
		restart();
		break;
	case 66: // B
		if(selected_link) {
			// set link direction to both left and right
			selected_link.left = true;
			selected_link.right = true; }
		restart();
		break;
	case 76: // L
		if(selected_link) {
			// set link direction to left only
			selected_link.left = true;
			selected_link.right = false; }
		restart();
		break;
	case 82: // R
		if(selected_node) {
			// toggle node reflexivity
			selected_node.reflexive = !selected_node.reflexive; }
		else if(selected_link) {
			// set link direction to right only
			selected_link.left = false;
			selected_link.right = true; }
		restart();
		break;
	}
}
function keyup() {
  lastKeyDown = -1;
  if(d3.event.keyCode === 17) { // ctrl
    circle.on( 'mousedown.drag', null)
          .on('touchstart.drag', null);
    svg.classed('ctrl', false);
  }
}
// app starts here
svg.on('mousedown', mousedown)
   .on('mousemove', mousemove)
   .on('mouseup'  , mouseup  );
d3.select(window)
  .on('keydown'   , keydown  )
  .on('keyup'     , keyup    );
restart();