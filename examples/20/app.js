/* app.js  (Directed Graph Editor) http://bl.ocks.org/rkirsling/5001347 */

// set up initial nodes and links
//  - links are set from source 'left' to target 'right'.
//  - nodes are known by 'id'.
//  - reflexive are indicated on the node as a bold black circle.
var force = d3.layout.force().size([width, height]).linkDistance(150).charge(-500),
	links = [ { source: 1, target: 2, left: false, right: true }
    		, { source: 2, target: 3, left: true , right: true }
            ],
	nodes = [ { id: 1, reflexive: false, color:'orange' }
        	, { id: 2, reflexive: true , color:'pink'   }
    		, { id: 3, reflexive: false, color:'green'  }
            ],
    lastNodeId = 3,
	getNodeById = {},

// set up SVG for D3
	width  = 460, height = 280, colors = d3.scale.category10(),
	svg = d3.select('body').append('svg')
	.attr('width', width).attr('height', height).attr('oncontextmenu', 'return false;');
// define arrow markers for graph links
svg.append('svg:defs').append('svg:marker')
     .attr('id', 'end-arrow')
     .attr('viewBox', '0 -5 10 10')
     .attr('refX', 6)
     .attr('markerWidth', 3)
     .attr('markerHeight', 3)
     .attr('orient', 'auto')
   .append('svg:path')
     .attr('d', 'M0,-5L10,0L0,5')
     .attr('fill', '#008');
svg.append('svg:defs').append('svg:marker')
     .attr('id', 'start-arrow')
     .attr('viewBox', '0 -5 10 10')
     .attr('refX', 6)
     .attr('markerWidth', 3)
     .attr('markerHeight', 3)
     .attr('orient', 'auto')
   .append('svg:path')
     .attr('d', 'M10,-5L0,0L10,5')
     .attr('fill', '#800');
// line displayed when dragging new nodes
var drag_line = svg.append('svg:path')
     .attr('class', 'link dragline hidden')
     .attr('d', 'M0,0L0,0');
// handles to link and node element groups
var path = svg.append('svg:g').selectAll('path'),
    circle = svg.append('svg:g').selectAll('g');
// debugger; ///// sam 20170216
// mouse event vars
var  selected_node = null,
     selected_link = null,
    mousedown_link = null,
    mousedown_node = null,
      mouseup_node = null;
function resetMouseVars() {
    mousedown_link = null,
    mousedown_node = null,
      mouseup_node = null;
}
// update force layout (called automatically each iteration)
function tick() {
  // draw directed edges with proper padding from node centers
  path.attr('d', function(d) {
  	if(isNaN(d.source.x)){
  		console.log('x and y undefined',JSON.stringify(d));
  	}
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
function myColor(d){                   ///// sam 20170216
  return d.color?d.color:colors(d.id); ///// sam 20170216
}                                      ///// sam 20170216
// update graph (called when needed)
function restart() {
// init D3 force layout
	getNodeById = {};
	nodes.forEach(function(node){
		getNodeById[node.id]=node;
	});
	links.forEach(function(link){
		var source=link.source, target=link.target;
		if (! source.id) {
			link.source=( getNodeById[source] || (getNodeById[source]={ id: source, color: 'gray' }) );
		}
		if (! target.id) {
			link.target=( getNodeById[target] || (getNodeById[target]={ id: target, color: 'gray' }) );
		}
	});
	// show the graph as a json
	json.value='{"nodes":\n ['+
	    nodes.map(function(N){
	      return '{"id":'+N.id+',"reflexive":'+N.reflexive+',"color":"'+myColor(N)+'"}'
	    }).join('\n ,')+'\n ],\n "links":\n ['+
	    links.map(function(L){
	      return '{"source":'+L.source.id+',"target":'+
	        L.target.id+',"left":'+L.left+',"right":'+L.right+'}'
	    }).join('\n ,')+'\n ]\n}';
	force.nodes(nodes).links(links).on('tick', tick);
  // path (link) group ----------------------------------------------------
  path = path.data(links);
  // debugger; ///// sam 20170216
  // update existing links
  path.classed('selected', function(d) { 
  	  return d === selected_link; })
    .style('marker-start', function(d) {
      return d.left  ? 'url(#start-arrow)' : ''; })
    .style('marker-end'  , function(d) { 
      return d.right ? 'url(  #end-arrow)' : ''; });
  // add new links
  
  path.enter().append('svg:path')
    .attr('class', 'link')
    .classed(  'selected', function(d) { 
      return d === selected_link; })
    .style('marker-start', function(d) { 
      return d.left  ? 'url(#start-arrow)' : ''; })
    .style('marker-end'  , function(d) { 
      return d.right ? 'url(#end-arrow  )' : ''; })
    .on('mouseup', function(d) {
      	  console.log('mouseup:',JSON.stringify(d));
      })
    .on('mousedown', function(d) {
      if(d3.event.ctrlKey) return;
      // select link
      mousedown_link = d;
      if(mousedown_link === selected_link) selected_link = null;
      else selected_link = mousedown_link;
      selected_node = null;
      restart();
    });
  // remove old links
  path.exit().remove();
  // circle (node) group ----------------------------------------------------
  // NB: the function arg is crucial here! nodes are known by id, not by index!
  circle = circle.data(nodes);

  // update existing nodes (reflexive & selected visual states)
  //console.log( '0. circle:\n'+JSON.stringify(circle) );
  circle.selectAll('circle')
  .style('fill', function(d) {
      return nodes[d.index].color;
  })
  .classed('reflexive', function(d) { return d.reflexive; })
  .classed('color', function(d) {
      return myColor(d);
  });

  // add new nodes
  var g = circle.enter().append('svg:g');

  g.append('svg:circle')
    .attr('class', 'node')
    .attr('r', 12)
    .style('fill', function(d) {
       return d === selected_node ? d3.rgb(myColor(d)).brighter().toString() : myColor(d); 
     }) ///// sam 20170216
    .style('stroke', function(d) {
       return d3.rgb(myColor(d)).darker().toString(); 
     }) ///// sam 20170216
    .classed('reflexive', function(d) { return d.reflexive; })
    .on('mouseover', function(d) {
      if(!mousedown_node || d === mousedown_node) return;
      // enlarge target node
      d3.select(this).attr('transform', 'scale(1.1)');
    })
    .on('mouseout', function(d) {
      if(!mousedown_node || d === mousedown_node) return;
      // unenlarge target node
      d3.select(this).attr('transform', '');
    })
    .on('mousedown', function(d) {
      if(d3.event.ctrlKey) return;

      // select node
      mousedown_node = d;
      if(mousedown_node === selected_node) selected_node = null;
      else selected_node = mousedown_node;
      selected_link = null;

      // reposition drag line
      drag_line
        .style('marker-end', 'url(#end-arrow)')
        .classed('hidden', false)
        .attr('d', 'M' + mousedown_node.x + ',' + mousedown_node.y + 'L' + mousedown_node.x + ',' + mousedown_node.y);

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
      if(mouseup_node === mousedown_node) { resetMouseVars(); return; }

      // unenlarge target node
      d3.select(this).attr('transform', '');

      // add link to graph (update if exists)
      // NB: links are strictly source < target; arrows separately specified by booleans
      var source, target, direction;
      if(mousedown_node.id < mouseup_node.id) {
        source = mousedown_node;
        target = mouseup_node;
        direction = 'right';
      } else {
        source = mouseup_node;
        target = mousedown_node;
        direction = 'left';
      }

      var link;
      link = links.filter(function(l) {
        return (l.source === source && l.target === target);
      })[0];

      if(link) {
        link[direction] = true;
      } else {
        link = {source: source, target: target, left: false, right: false};
        link[direction] = true;
        links.push(link);
      }

      // select new link
      selected_link = link;
      selected_node = null;
      restart();
    });

  // show node IDs
  g.append('svg:text')
      .attr('x', 0)
      .attr('y', 4)
      .attr('class', 'id')
      .text(function(d) { return d.id; });
  // remove old nodes
  circle.exit().remove();
  
  // set the graph in motion
//setTimeout(function(){
  	force.start();
//},10);
}

function load() {
  var J=JSON.parse(json.value);
  nodes=J.nodes, links=J.links;
  svg.classed('active', true);
  setTimeout(restart,0);
}

function mousedown() {
  // prevent I-bar on drag
  //d3.event.preventDefault();

  // because :active only works in WebKit?
  svg.classed('active', true);

  if(d3.event.ctrlKey || mousedown_node || mousedown_link) return;

  // insert new node at point
  var point = d3.mouse(this), node = {id: ++lastNodeId, reflexive: false, color: 'gray'};
  node.x = point[0];
  node.y = point[1];
  nodes.push(node);

  restart();
}

function mousemove() {
  if(!mousedown_node) return;

  // update drag line
  drag_line.attr('d', 'M' + mousedown_node.x + ',' + mousedown_node.y + 'L' + d3.mouse(this)[0] + ',' + d3.mouse(this)[1]);

  restart();
}

function mouseup() {
  if(mousedown_node) {
    // hide drag line
    drag_line
      .classed('hidden', true)
      .style('marker-end', '');
  }

  // because :active only works in WebKit?
  svg.classed('active', false);

  // clear mouse event vars
  resetMouseVars();
}

function spliceLinksForNode(node) {
  var toSplice = links.filter(function(l) {
    return (l.source === node || l.target === node);
  });
  toSplice.map(function(l) {
    links.splice(links.indexOf(l), 1);
  });
}

// only respond once per keydown
var lastKeyDown = -1;

function keydown() {
  d3.event.preventDefault();

  if(lastKeyDown !== -1) return;
  lastKeyDown = d3.event.keyCode;

  // ctrl
  if(d3.event.keyCode === 17) {
    circle.call(force.drag);
    svg.classed('ctrl', true);
  }

  if(!selected_node && !selected_link) return;
  switch(d3.event.keyCode) {
    case 8: // backspace
    case 46: // delete
      if(selected_node) {
        nodes.splice(nodes.indexOf(selected_node), 1);
        spliceLinksForNode(selected_node);
      } else if(selected_link) {
        links.splice(links.indexOf(selected_link), 1);
      }
      selected_link = null;
      selected_node = null;
      restart();
      break;
    case 66: // B
      if(selected_link) {
        // set link direction to both left and right
        selected_link.left = true;
        selected_link.right = true;
      }
      restart();
      break;
    case 76: // L
      if(selected_link) {
        // set link direction to left only
        selected_link.left = true;
        selected_link.right = false;
      }
      restart();
      break;
    case 82: // R
      if(selected_node) {
        // toggle node reflexivity
        selected_node.reflexive = !selected_node.reflexive;
      } else if(selected_link) {
        // set link direction to right only
        selected_link.left = false;
        selected_link.right = true;
      }
      restart();
      break;
  }
}

function keyup() {
  lastKeyDown = -1;

  // ctrl
  if(d3.event.keyCode === 17) {
    circle
      .on('mousedown.drag', null)
      .on('touchstart.drag', null);
    svg.classed('ctrl', false);
  }
}

// app starts here
svg.on('mousedown', mousedown)
   .on('mousemove', mousemove)
   .on('mouseup'  , mouseup  );
//d3.select("svg")
//  .on('keydown', keydown)
//  .on('keyup'  , keyup  );
restart();