;(function(undefined) {
  'use strict';

  /**
   * Sigma Quadtree Module for edges
   * ===============================
   *
   * Author: Sébastien Heymann,
   *   from the quad of Guillaume Plique (Yomguithereal)
   * Version: 0.2
   */



  /**
   * Quad Geometric Operations
   * -------------------------
   *
   * A useful batch of geometric operations used by the quadtree.
   */

  var _geom = {

    /**
     * Transforms a graph node with x, y and size into an
     * axis-aligned square.
     *
     * @param  {object} A graph node with at least a point (x, y) and a size.
     * @return {object} A square: two points (x1, y1), (x2, y2) and height.
     */
    pointToSquare: function(n) {
      return {
        x1: n.x - n.size,
        y1: n.y - n.size,
        x2: n.x + n.size,
        y2: n.y - n.size,
        height: n.size * 2
      };
    },

    /**
     * Transforms a graph edge with x1, y1, x2, y2 and size into an
     * axis-aligned square.
     *
     * @param  {object} A graph edge with at least two points
     *                  (x1, y1), (x2, y2) and a size.
     * @return {object} A square: two points (x1, y1), (x2, y2) and height.
     */
    lineToSquare: function(e) {
      if (e.y1 < e.y2) {
        // (e.x1, e.y1) on top
        if (e.x1 < e.x2) {
          // (e.x1, e.y1) on left
          return {
            x1: e.x1 - e.size,
            y1: e.y1 - e.size,
            x2: e.x2 + e.size,
            y2: e.y1 - e.size,
            height: e.y2 - e.y1 + e.size * 2
          };
        }
        // (e.x1, e.y1) on right
        return {
          x1: e.x2 - e.size,
          y1: e.y1 - e.size,
          x2: e.x1 + e.size,
          y2: e.y1 - e.size,
          height: e.y2 - e.y1 + e.size * 2
        };
      }

      // (e.x2, e.y2) on top
      if (e.x1 < e.x2) {
        // (e.x1, e.y1) on left
        return {
          x1: e.x1 - e.size,
          y1: e.y2 - e.size,
          x2: e.x2 + e.size,
          y2: e.y2 - e.size,
          height: e.y1 - e.y2 + e.size * 2
        };
      }
      // (e.x2, e.y2) on right
      return {
        x1: e.x2 - e.size,
        y1: e.y2 - e.size,
        x2: e.x1 + e.size,
        y2: e.y2 - e.size,
        height: e.y1 - e.y2 + e.size * 2
      };
    },

    /**
     * Transforms a graph edge of type 'curve' with x1, y1, x2, y2,
     * control point and size into an axis-aligned square.
     *
     * @param  {object} e  A graph edge with at least two points
     *                     (x1, y1), (x2, y2) and a size.
     * @param  {object} cp A control point (x,y).
     * @return {object}    A square: two points (x1, y1), (x2, y2) and height.
     */
    quadraticCurveToSquare: function(e, cp) {
      var pt = sigma.utils.getPointOnQuadraticCurve(
        0.5,
        e.x1,
        e.y1,
        e.x2,
        e.y2,
        cp.x,
        cp.y
      );

      // Bounding box of the two points and the point at the middle of the
      // curve:
      var minX = Math.min(e.x1, e.x2, pt.x),
          maxX = Math.max(e.x1, e.x2, pt.x),
          minY = Math.min(e.y1, e.y2, pt.y),
          maxY = Math.max(e.y1, e.y2, pt.y);

      return {
        x1: minX - e.size,
        y1: minY - e.size,
        x2: maxX + e.size,
        y2: minY - e.size,
        height: maxY - minY + e.size * 2
      };
    },

    /**
     * Transforms a graph self loop into an axis-aligned square.
     *
     * @param  {object} n A graph node with a point (x, y) and a size.
     * @return {object}   A square: two points (x1, y1), (x2, y2) and height.
     */
    selfLoopToSquare: function(n) {
      // Fitting to the curve is too costly, we compute a larger bounding box
      // using the control points:
      var cp = sigma.utils.getSelfLoopControlPoints(n.x, n.y, n.size);

      // Bounding box of the point and the two control points:
      var minX = Math.min(n.x, cp.x1, cp.x2),
          maxX = Math.max(n.x, cp.x1, cp.x2),
          minY = Math.min(n.y, cp.y1, cp.y2),
          maxY = Math.max(n.y, cp.y1, cp.y2);

      return {
        x1: minX - n.size,
        y1: minY - n.size,
        x2: maxX + n.size,
        y2: minY - n.size,
        height: maxY - minY + n.size * 2
      };
    },

    /**
     * Checks whether a rectangle is axis-aligned.
     *
     * @param  {object}  A rectangle defined by two points
     *                   (x1, y1) and (x2, y2).
     * @return {boolean} True if the rectangle is axis-aligned.
     */
    isAxisAligned: function(r) {
      return r.x1 === r.x2 || r.y1 === r.y2;
    },

    /**
     * Compute top points of an axis-aligned rectangle. This is useful in
     * cases when the rectangle has been rotated (left, right or bottom up) and
     * later operations need to know the top points.
     *
     * @param  {object} An axis-aligned rectangle defined by two points
     *                  (x1, y1), (x2, y2) and height.
     * @return {object} A rectangle: two points (x1, y1), (x2, y2) and height.
     */
    axisAlignedTopPoints: function(r) {

      // Basic
      if (r.y1 === r.y2 && r.x1 < r.x2)
        return r;

      // Rotated to right
      if (r.x1 === r.x2 && r.y2 > r.y1)
        return {
          x1: r.x1 - r.height, y1: r.y1,
          x2: r.x1, y2: r.y1,
          height: r.height
        };

      // Rotated to left
      if (r.x1 === r.x2 && r.y2 < r.y1)
        return {
          x1: r.x1, y1: r.y2,
          x2: r.x2 + r.height, y2: r.y2,
          height: r.height
        };

      // Bottom's up
      return {
        x1: r.x2, y1: r.y1 - r.height,
        x2: r.x1, y2: r.y1 - r.height,
        height: r.height
      };
    },

    /**
     * Get coordinates of a rectangle's lower left corner from its top points.
     *
     * @param  {object} A rectangle defined by two points (x1, y1) and (x2, y2).
     * @return {object} Coordinates of the corner (x, y).
     */
    lowerLeftCoor: function(r) {
      var width = (
        Math.sqrt(
          Math.pow(r.x2 - r.x1, 2) +
          Math.pow(r.y2 - r.y1, 2)
        )
      );

      return {
        x: r.x1 - (r.y2 - r.y1) * r.height / width,
        y: r.y1 + (r.x2 - r.x1) * r.height / width
      };
    },

    /**
     * Get coordinates of a rectangle's lower right corner from its top points
     * and its lower left corner.
     *
     * @param  {object} A rectangle defined by two points (x1, y1) and (x2, y2).
     * @param  {object} A corner's coordinates (x, y).
     * @return {object} Coordinates of the corner (x, y).
     */
    lowerRightCoor: function(r, llc) {
      return {
        x: llc.x - r.x1 + r.x2,
        y: llc.y - r.y1 + r.y2
      };
    },

    /**
     * Get the coordinates of all the corners of a rectangle from its top point.
     *
     * @param  {object} A rectangle defined by two points (x1, y1) and (x2, y2).
     * @return {array}  An array of the four corners' coordinates (x, y).
     */
    rectangleCorners: function(r) {
      var llc = this.lowerLeftCoor(r),
          lrc = this.lowerRightCoor(r, llc);

      return [
        {x: r.x1, y: r.y1},
        {x: r.x2, y: r.y2},
        {x: llc.x, y: llc.y},
        {x: lrc.x, y: lrc.y}
      ];
    },

    /**
     * Split a square defined by its boundaries into four.
     *
     * @param  {object} Boundaries of the square (x, y, width, height).
     * @return {array}  An array containing the four new squares, themselves
     *                  defined by an array of their four corners (x, y).
     */
    splitSquare: function(b) {
      return [
        [
          {x: b.x, y: b.y},
          {x: b.x + b.width / 2, y: b.y},
          {x: b.x, y: b.y + b.height / 2},
          {x: b.x + b.width / 2, y: b.y + b.height / 2}
        ],
        [
          {x: b.x + b.width / 2, y: b.y},
          {x: b.x + b.width, y: b.y},
          {x: b.x + b.width / 2, y: b.y + b.height / 2},
          {x: b.x + b.width, y: b.y + b.height / 2}
        ],
        [
          {x: b.x, y: b.y + b.height / 2},
          {x: b.x + b.width / 2, y: b.y + b.height / 2},
          {x: b.x, y: b.y + b.height},
          {x: b.x + b.width / 2, y: b.y + b.height}
        ],
        [
          {x: b.x + b.width / 2, y: b.y + b.height / 2},
          {x: b.x + b.width, y: b.y + b.height / 2},
          {x: b.x + b.width / 2, y: b.y + b.height},
          {x: b.x + b.width, y: b.y + b.height}
        ]
      ];
    },

    /**
     * Compute the four axis between corners of rectangle A and corners of
     * rectangle B. This is needed later to check an eventual collision.
     *
     * @param  {array} An array of rectangle A's four corners (x, y).
     * @param  {array} An array of rectangle B's four corners (x, y).
     * @return {array} An array of four axis defined by their coordinates (x,y).
     */
    axis: function(c1, c2) {
      return [
        {x: c1[1].x - c1[0].x, y: c1[1].y - c1[0].y},
        {x: c1[1].x - c1[3].x, y: c1[1].y - c1[3].y},
        {x: c2[0].x - c2[2].x, y: c2[0].y - c2[2].y},
        {x: c2[0].x - c2[1].x, y: c2[0].y - c2[1].y}
      ];
    },

    /**
     * Project a rectangle's corner on an axis.
     *
     * @param  {object} Coordinates of a corner (x, y).
     * @param  {object} Coordinates of an axis (x, y).
     * @return {object} The projection defined by coordinates (x, y).
     */
    projection: function(c, a) {
      var l = (
        (c.x * a.x + c.y * a.y) /
        (Math.pow(a.x, 2) + Math.pow(a.y, 2))
      );

      return {
        x: l * a.x,
        y: l * a.y
      };
    },

    /**
     * Check whether two rectangles collide on one particular axis.
     *
     * @param  {object}   An axis' coordinates (x, y).
     * @param  {array}    Rectangle A's corners.
     * @param  {array}    Rectangle B's corners.
     * @return {boolean}  True if the rectangles collide on the axis.
     */
    axisCollision: function(a, c1, c2) {
      var sc1 = [],
          sc2 = [];

      for (var ci = 0; ci < 4; ci++) {
        var p1 = this.projection(c1[ci], a),
            p2 = this.projection(c2[ci], a);

        sc1.push(p1.x * a.x + p1.y * a.y);
        sc2.push(p2.x * a.x + p2.y * a.y);
      }

      var maxc1 = Math.max.apply(Math, sc1),
          maxc2 = Math.max.apply(Math, sc2),
          minc1 = Math.min.apply(Math, sc1),
          minc2 = Math.min.apply(Math, sc2);

      return (minc2 <= maxc1 && maxc2 >= minc1);
    },

    /**
     * Check whether two rectangles collide on each one of their four axis. If
     * all axis collide, then the two rectangles do collide on the plane.
     *
     * @param  {array}    Rectangle A's corners.
     * @param  {array}    Rectangle B's corners.
     * @return {boolean}  True if the rectangles collide.
     */
    collision: function(c1, c2) {
      var axis = this.axis(c1, c2),
          col = true;

      for (var i = 0; i < 4; i++)
        col = col && this.axisCollision(axis[i], c1, c2);

      return col;
    }
  };


  /**
   * Quad Functions
   * ------------
   *
   * The Quadtree functions themselves.
   * For each of those functions, we consider that in a splitted quad, the
   * index of each node is the following:
   * 0: top left
   * 1: top right
   * 2: bottom left
   * 3: bottom right
   *
   * Moreover, the hereafter quad's philosophy is to consider that if an element
   * collides with more than one nodes, this element belongs to each of the
   * nodes it collides with where other would let it lie on a higher node.
   */

  /**
   * Get the index of the node containing the point in the quad
   *
   * @param  {object}  point      A point defined by coordinates (x, y).
   * @param  {object}  quadBounds Boundaries of the quad (x, y, width, heigth).
   * @return {integer}            The index of the node containing the point.
   */
  function _quadIndex(point, quadBounds) {
    var xmp = quadBounds.x + quadBounds.width / 2,
        ymp = quadBounds.y + quadBounds.height / 2,
        top = (point.y < ymp),
        left = (point.x < xmp);

    if (top) {
      if (left)
        return 0;
      else
        return 1;
    }
    else {
      if (left)
        return 2;
      else
        return 3;
    }
  }

  /**
   * Get a list of indexes of nodes containing an axis-aligned rectangle
   *
   * @param  {object}  rectangle   A rectangle defined by two points (x1, y1),
   *                               (x2, y2) and height.
   * @param  {array}   quadCorners An array of the quad nodes' corners.
   * @return {array}               An array of indexes containing one to
   *                               four integers.
   */
  function _quadIndexes(rectangle, quadCorners) {
    var indexes = [];

    // Iterating through quads
    for (var i = 0; i < 4; i++)
      if ((rectangle.x2 >= quadCorners[i][0].x) &&
          (rectangle.x1 <= quadCorners[i][1].x) &&
          (rectangle.y1 + rectangle.height >= quadCorners[i][0].y) &&
          (rectangle.y1 <= quadCorners[i][2].y))
        indexes.push(i);

    return indexes;
  }

  /**
   * Get a list of indexes of nodes containing a non-axis-aligned rectangle
   *
   * @param  {array}  corners      An array containing each corner of the
   *                               rectangle defined by its coordinates (x, y).
   * @param  {array}  quadCorners  An array of the quad nodes' corners.
   * @return {array}               An array of indexes containing one to
   *                               four integers.
   */
  function _quadCollision(corners, quadCorners) {
    var indexes = [];

    // Iterating through quads
    for (var i = 0; i < 4; i++)
      if (_geom.collision(corners, quadCorners[i]))
        indexes.push(i);

    return indexes;
  }

  /**
   * Subdivide a quad by creating a node at a precise index. The function does
   * not generate all four nodes not to potentially create unused nodes.
   *
   * @param  {integer}  index The index of the node to create.
   * @param  {object}   quad  The quad object to subdivide.
   * @return {object}         A new quad representing the node created.
   */
  function _quadSubdivide(index, quad) {
    var next = quad.level + 1,
        subw = Math.round(quad.bounds.width / 2),
        subh = Math.round(quad.bounds.height / 2),
        qx = Math.round(quad.bounds.x),
        qy = Math.round(quad.bounds.y),
        x,
        y;

    switch (index) {
      case 0:
        x = qx;
        y = qy;
        break;
      case 1:
        x = qx + subw;
        y = qy;
        break;
      case 2:
        x = qx;
        y = qy + subh;
        break;
      case 3:
        x = qx + subw;
        y = qy + subh;
        break;
    }

    return _quadTree(
      {x: x, y: y, width: subw, height: subh},
      next,
      quad.maxElements,
      quad.maxLevel
    );
  }

  /**
   * Recursively insert an element into the quadtree. Only points
   * with size, i.e. axis-aligned squares, may be inserted with this
   * method.
   *
   * @param  {object}  el         The element to insert in the quadtree.
   * @param  {object}  sizedPoint A sized point defined by two top points
   *                              (x1, y1), (x2, y2) and height.
   * @param  {object}  quad       The quad in which to insert the element.
   * @return {undefined}          The function does not return anything.
   */
  function _quadInsert(el, sizedPoint, quad) {
    if (quad.level < quad.maxLevel) {

      // Searching appropriate quads
      var indexes = _quadIndexes(sizedPoint, quad.corners);

      // Iterating
      for (var i = 0, l = indexes.length; i < l; i++) {

        // Subdividing if necessary
        if (quad.nodes[indexes[i]] === undefined)
          quad.nodes[indexes[i]] = _quadSubdivide(indexes[i], quad);

        // Recursion
        _quadInsert(el, sizedPoint, quad.nodes[indexes[i]]);
      }
    }
    else {

      // Pushing the element in a leaf node
      quad.elements.push(el);
    }
  }

  /**
   * Recursively retrieve every elements held by the node containing the
   * searched point.
   *
   * @param  {object}  point The searched point (x, y).
   * @param  {object}  quad  The searched quad.
   * @return {array}         An array of elements contained in the relevant
   *                         node.
   */
  function _quadRetrievePoint(point, quad) {
    if (quad.level < quad.maxLevel) {
      var index = _quadIndex(point, quad.bounds);

      // If node does not exist we return an empty list
      if (quad.nodes[index] !== undefined) {
        return _quadRetrievePoint(point, quad.nodes[index]);
      }
      else {
        return [];
      }
    }
    else {
      return quad.elements;
    }
  }

  /**
   * Recursively retrieve every elements contained within an rectangular area
   * that may or may not be axis-aligned.
   *
   * @param  {object|array} rectData       The searched area defined either by
   *                                       an array of four corners (x, y) in
   *                                       the case of a non-axis-aligned
   *                                       rectangle or an object with two top
   *                                       points (x1, y1), (x2, y2) and height.
   * @param  {object}       quad           The searched quad.
   * @param  {function}     collisionFunc  The collision function used to search
   *                                       for node indexes.
   * @param  {array?}       els            The retrieved elements.
   * @return {array}                       An array of elements contained in the
   *                                       area.
   */
  function _quadRetrieveArea(rectData, quad, collisionFunc, els) {
    els = els || {};

    if (quad.level < quad.maxLevel) {
      var indexes = collisionFunc(rectData, quad.corners);

      for (var i = 0, l = indexes.length; i < l; i++)
        if (quad.nodes[indexes[i]] !== undefined)
          _quadRetrieveArea(
            rectData,
            quad.nodes[indexes[i]],
            collisionFunc,
            els
          );
    } else
      for (var j = 0, m = quad.elements.length; j < m; j++)
        if (els[quad.elements[j].id] === undefined)
          els[quad.elements[j].id] = quad.elements[j];

    return els;
  }

  /**
   * Creates the quadtree object itself.
   *
   * @param  {object}   bounds       The boundaries of the quad defined by an
   *                                 origin (x, y), width and heigth.
   * @param  {integer}  level        The level of the quad in the tree.
   * @param  {integer}  maxElements  The max number of element in a leaf node.
   * @param  {integer}  maxLevel     The max recursion level of the tree.
   * @return {object}                The quadtree object.
   */
  function _quadTree(bounds, level, maxElements, maxLevel) {
    return {
      level: level || 0,
      bounds: bounds,
      corners: _geom.splitSquare(bounds),
      maxElements: maxElements || 40,
      maxLevel: maxLevel || 8,
      elements: [],
      nodes: []
    };
  }


  /**
   * Sigma Quad Constructor
   * ----------------------
   *
   * The edgequad API as exposed to sigma.
   */

  /**
   * The edgequad core that will become the sigma interface with the quadtree.
   *
   * property {object} _tree     Property holding the quadtree object.
   * property {object} _geom     Exposition of the _geom namespace for testing.
   * property {object} _cache    Cache for the area method.
   * property {boolean} _enabled Can index and retreive elements.
   */
  var edgequad = function() {
    this._geom = _geom;
    this._tree = null;
    this._cache = {
      query: false,
      result: false
    };
    this._enabled = true;
  };

  /**
   * Index a graph by inserting its edges into the quadtree.
   *
   * @param  {object} graph   A graph instance.
   * @param  {object} params  An object of parameters with at least the quad
   *                          bounds.
   * @return {object}         The quadtree object.
   *
   * Parameters:
   * ----------
   * bounds:      {object}   boundaries of the quad defined by its origin (x, y)
   *                         width and heigth.
   * prefix:      {string?}  a prefix for edge geometric attributes.
   * maxElements: {integer?} the max number of elements in a leaf node.
   * maxLevel:    {integer?} the max recursion level of the tree.
   */
  edgequad.prototype.index = function(graph, params) {
    if (!this._enabled)
      return this._tree;

    // Enforcing presence of boundaries
    if (!params.bounds)
      throw 'sigma.classes.edgequad.index: bounds information not given.';

    // Prefix
    var prefix = params.prefix || '',
        cp,
        source,
        target,
        n,
        e;

    // Building the tree
    this._tree = _quadTree(
      params.bounds,
      0,
      params.maxElements,
      params.maxLevel
    );

    var edges = graph.edges();

    // Inserting graph edges into the tree
    for (var i = 0, l = edges.length; i < l; i++) {
      source = graph.nodes(edges[i].source);
      target = graph.nodes(edges[i].target);
      e = {
        x1: source[prefix + 'x'],
        y1: source[prefix + 'y'],
        x2: target[prefix + 'x'],
        y2: target[prefix + 'y'],
        size: edges[i][prefix + 'size'] || 0
      };

      // Inserting edge
      if (edges[i].type === 'curve' || edges[i].type === 'curvedArrow') {
        if (source.id === target.id) {
          n = {
            x: source[prefix + 'x'],
            y: source[prefix + 'y'],
            size: source[prefix + 'size'] || 0
          };
          _quadInsert(
            edges[i],
            _geom.selfLoopToSquare(n),
            this._tree);
        }
        else {
          cp = sigma.utils.getQuadraticControlPoint(e.x1, e.y1, e.x2, e.y2);
          _quadInsert(
            edges[i],
            _geom.quadraticCurveToSquare(e, cp),
            this._tree);
        }
      }
      else {
        _quadInsert(
          edges[i],
          _geom.lineToSquare(e),
          this._tree);
      }
    }

    // Reset cache:
    this._cache = {
      query: false,
      result: false
    };

    // remove?
    return this._tree;
  };

  /**
   * Retrieve every graph edges held by the quadtree node containing the
   * searched point.
   *
   * @param  {number} x of the point.
   * @param  {number} y of the point.
   * @return {array}  An array of edges retrieved.
   */
  edgequad.prototype.point = function(x, y) {
    if (!this._enabled)
      return [];

    return this._tree ?
      _quadRetrievePoint({x: x, y: y}, this._tree) || [] :
      [];
  };

  /**
   * Retrieve every graph edges within a rectangular area. The methods keep the
   * last area queried in cache for optimization reason and will act differently
   * for the same reason if the area is axis-aligned or not.
   *
   * @param  {object} A rectangle defined by two top points (x1, y1), (x2, y2)
   *                  and height.
   * @return {array}  An array of edges retrieved.
   */
  edgequad.prototype.area = function(rect) {
    if (!this._enabled)
      return [];

    var serialized = JSON.stringify(rect),
        collisionFunc,
        rectData;

    // Returning cache?
    if (this._cache.query === serialized)
      return this._cache.result;

    // Axis aligned ?
    if (_geom.isAxisAligned(rect)) {
      collisionFunc = _quadIndexes;
      rectData = _geom.axisAlignedTopPoints(rect);
    }
    else {
      collisionFunc = _quadCollision;
      rectData = _geom.rectangleCorners(rect);
    }

    // Retrieving edges
    var edges = this._tree ?
      _quadRetrieveArea(
        rectData,
        this._tree,
        collisionFunc
      ) :
      [];

    // Object to array
    var edgesArray = [];
    for (var i in edges)
      edgesArray.push(edges[i]);

    // Caching
    this._cache.query = serialized;
    this._cache.result = edgesArray;

    return edgesArray;
  };


  /**
   * EXPORT:
   * *******
   */
  if (typeof window.sigma !== 'undefined') {
    window.sigma.classes = window.sigma.classes || {};
    window.sigma.classes.edgequad = edgequad;
  } else if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports)
      exports = module.exports = edgequad;
    exports.edgequad = edgequad;
  } else
    window.edgequad = edgequad;
}).call(this);
