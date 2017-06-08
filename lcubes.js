var lcubes = (function() {

    // Each cube shall be represented as an integer [0..3]
    // where the integer maps to some direction, tbd
    var yellow = 0xdec062;
    var green = 0x006600;
    var blue = 0x000099;
    var red = 0x990000;
    var colors = [yellow, green, blue, red, red, blue, 
    yellow, green, blue, red, red, blue];

    var ORIGIN = {x:0, y:0, z:0};

    var NUM_CUBES = 12;

    var LOGGING = true;
    var OPTIMIZE = true;

    var collisionGrid;

    //
    // ---- extra functions
    //

    function drawCube(pos, color) {
        graphics.addCube( { x: pos.x * 70, 
            y: pos.y * 70 + 35, 
            z: pos.z * 70}, color );
    }

    function drawConfig(startPos, cubes, initDir) {
        if (cubes.length + 2 != NUM_CUBES) {
            console.log("Error: cubes.length [" + cubes.length + "] != NUM_CUBES [" + NUM_CUBES + "] - 2");
            return;
        }

        var direction = initDir;
        var currPos = startPos;
        cLog(currPos);
        // immediately draw the first (yellow) block because it's always at the orign
        drawCube(currPos, colors[0]);
        currPos = nextPos(currPos, direction);
        for (var i=0; i<cubes.length; i++) {
            cLog(currPos);
            drawCube(currPos, colors[i+1]);
            direction = nextDir(direction, cubes[i]);
            currPos = nextPos(currPos, direction);
        }
        drawCube(currPos, colors[i+1]);
        cLog(currPos);
    }

    // shoddy logger
    function cLog(msg) {
        if (LOGGING) { console.log(msg); }
    }

    // timer
    function timer(name) {
        var start = new Date();
        return {
            stop: function() {
                var end = new Date();
                var time = end.getTime() - start.getTime();
                console.log('Timer:', name, 'finished in', time, 'ms');
            }
        }
    }

    function dotProduct(v1, v2) {
        return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
    }

    //
    // ----- Mechanics functions
    //

    // Next pos is a function of the current Position and direction
    function nextPos(currPos, currDir) {
        var nextPos = {};
        nextPos.x = currPos.x + currDir.x; 
        nextPos.y = currPos.y + currDir.y; 
        nextPos.z = currPos.z + currDir.z; 

        return nextPos;
    }

    // Next direction is a function of the current direction and
    // the next block's orientation
    function nextDir(currDir, nextOrientation) {
        var nextDir = {};
        var phi = nextOrientation;
        // next.x = y * sin(phi * PI/2) + z * cos(phi * PI/2)
        // next.y = z * sin(phi * PI/2) + x * cos(phi * PI/2)
        // next.z = x * sin(phi * PI/2) + y * cos(phi * PI/2)
        var opSin = Math.round(Math.sin(phi * Math.PI/2));
        var opCos = Math.round(Math.cos(phi * Math.PI/2));
        nextDir.x = Math.round(currDir.y * opSin + currDir.z * opCos);
        nextDir.y = Math.round(currDir.z * opSin + currDir.x * opCos);
        nextDir.z = Math.round(currDir.x * opSin + currDir.y * opCos);

        return nextDir;
    }

    // True if the last block is adjacent to the origin (0, 0, 0) and only 
    // on the y and z axes.
    // Cubes should be an array of length NUM_CUBES - 2, because the 
    // orientations of the first and last cubes are irrelevant
    function testConfig(cubes) {
        if (cubes.length + 2 != NUM_CUBES) {
            console.log("Error: cubes.length [" + cubes.length + "] != NUM_CUBES [" + NUM_CUBES + "] - 2");
            return;
        }

        var currPos = {x:0, y:0, z:0};
        var direction = {x:1, y:0, z:0};

        for (var i=0; i<cubes.length; i++) {
            currPos = nextPos(currPos, direction);
            direction = nextDir(direction, cubes[i]);
        }
        currPos = nextPos(currPos, direction);
        return (gridDistance(currPos, ORIGIN) == 0) && (currPos.x == 0);
    }
    
    //
    // ---- Collision Grid Functions
    //

    // Number of blocks between p1 and p2, not normal distance calc
    function gridDistance(p1, p2) {
        return Math.abs(p2.x - p1.x) + Math.abs(p2.y - p1.y) + Math.abs(p2.z - p1.z) - 1;
    }

    function gridDistanceVector(p1, p2) {
        return {x: Math.abs(p2.x - p1.x),
            y: Math.abs(p2.y - p1.y),
            z: Math.abs(p2.z - p1.z)};
    } 

    function dupGrid(grid) {
        var dup = [];
        for (var i=0; i < grid.length; i++) {
            dup.push(new Array());
            for (var j=0; j < grid[i].length; j++) {
                dup[i].push(new Array());
                for (var k=0; k < grid[i][j].length; k++) {
                    dup[i][j].push(grid[i][j][k]);
                }
            }
        }
        return dup;
    }
    
    function isCollision(coord) {
        // Translate negative coords to array indices to get "v"irtual
        // coordinates
        var vX = coord.x + 5;
        var vY = coord.y + 5;
        var vZ = coord.z + 5;

        return (collisionGrid[vX][vY][vZ] == 1);
    }

    function markOccupied(coord) {
        var vX = coord.x + 5;
        var vY = coord.y + 5;
        var vZ = coord.z + 5;
        
        collisionGrid[vX][vY][vZ] = 1;
    }

    function markUnoccupied(coord) {
        var vX = coord.x + 5;
        var vY = coord.y + 5;
        var vZ = coord.z + 5;
        
        collisionGrid[vX][vY][vZ] = 0;
    }

    function init12x12x12() {
        var grid = [];
        for (var i = 0; i<12; i++) {
            grid.push(new Array());
            for (var j = 0; j<12; j++) {
                grid[i].push(new Array());
                for (var k = 0; k<12; k++) {
                    grid[i][j].push(0);
                }
            }
        }
        collisionGrid = grid;
    }

    // a test block is too far if its position is too
    // many blocks away from the origin cube
    function isTooFar(position, configLength) {
        if (!OPTIMIZE) { return false };
        // configLength = number of settled orientations
        // 2, because the block being tested and the origin block
        //   are not part of the config
        var remainingCubes = NUM_CUBES - configLength - 2;
        return gridDistance(position, ORIGIN) > remainingCubes;
    }

    //
    // ------- Depth First Search for stable configurations
    //
    
    // The block here is being considered and may not collide
    // with other blocks. Immediately mark off as occupied.
    //
    // [config] is the list of configurations until now
    //   in the beginning, should be an empty list
    // [pos] is this block's position. in the beginning, will 
    //   always be {x:1, y:0, z:0}
    // [dir] is this block's direction. in the beginning, will
    //   always be {x:1, y:0, z:0}
    function dfs(config, pos, dir) {

        graphics.pushCube(pos, colors[config.length + 1]);
        markOccupied(pos);

        if (config.length == NUM_CUBES-2) {
            var dv = gridDistanceVector(ORIGIN, pos);
            var isPerpendicular = dotProduct(dv, dir) == 0;
            /*
            if (gridDistance(pos, ORIGIN) != 0) {
                cLog("rejected because not adjacent");
            } else if (!pos.x == 0) {
                cLog("rejected because adjacent on x axis");
            } else if (!isPerpendicular) {
                cLog("rejected because not perpendicular");
            } else {
                cLog("accepted... i think??");
            }
            */
            var stable = (gridDistance(pos, ORIGIN) == 0) && (pos.x == 0) && isPerpendicular;
            if(!stable) { graphics.popCube(); }
            markUnoccupied(pos);
            return {
                isStable: stable,
                completeConfig: config,
                steps: 1
            };
        }

        // Decide the current block's orientation
        var seed = Math.floor(Math.random() * 4);
        var stepsHere = 1;
        for (var i=0; i<4; i++) {
            var orient = (seed + i) % 4;
            var testDir = nextDir(dir, orient);
            //var testDir = nextDir(dir, i);
            var testPos = nextPos(pos, testDir);
            if (isCollision(testPos)) {
                //cLog("collision");
                continue;
            }

            if (isTooFar(testPos, config.length)) {
                //cLog("too far!!! (" + testPos.x + "," + testPos.y + "," + testPos.z + ")... distance="+gridDistance(testPos,ORIGIN) + " remaining blocks=" + (NUM_CUBES - config.length - 2));
                continue;
            }
            config.push(orient);
            var resp = dfs(config, testPos, testDir);
            stepsHere += resp.steps;

            if (resp.isStable) {
                cLog("going home!");
                cLog(resp);
                resp.steps = stepsHere;
                return resp;
            }

            // restore the config
            config.pop();
        }
            
        // pop graphics
        graphics.popCube();
        markUnoccupied(pos);
        return { isStable: false, steps: stepsHere };
    }

    function init() {
        // initialize an empty grid
        init12x12x12();

        var config = [];
        var initPos = {x:1, y:0, z:0};
        var initDir = {x:1, y:0, z:0};

        graphics.pushCube(ORIGIN, colors[0]);
        markOccupied(ORIGIN);

        var t = timer('dfs timer');
        var resp = dfs(config, initPos, initDir);
        t.stop();
        cLog(resp);
        cLog(resp.completeConfig);
        console.log("Took", resp.steps, "steps to find solution");
    }

    init();
})();
