var lcubes = (function() {

    // Each cube shall be represented as an integer [0..3]
    // where the integer maps to some direction, tbd
    var yellow = 0xdec062;
    var green = 0x006600;
    var blue = 0x000099;
    var red = 0x990000;
    var colors = [yellow, green, blue, red, red, blue, 
    yellow, green, blue, red, red, blue];

    var num_cubes = 12;

    function drawCube(pos, color) {
        graphics.addCube( { x: pos.x * 70, 
            y: pos.y * 70 + 35, 
            z: pos.z * 70}, color );
    }

    // Cube is drawn relative to some hardcoded origin (for now)
    function drawTransientCube(pos, color) {
        var o = {x:0, y:2, z:0};
        graphics.addCube( { x: (pos.x + o.x) * 70, 
            y: (pos.y + o.y) * 70 + 35, 
            z: (pos.z + o.z) * 70}, color );
    }

    function removeTransientCube() {
        graphics.popCube();
    }

    function drawConfig(origin, cubes, initDir) {
        if (cubes.length + 2 != num_cubes) {
            console.log("Error: cubes.length [" + cubes.length + "] != num_cubes [" + num_cubes + "] - 2");
            return;
        }

        var direction = initDir;
        var currPos = origin;
        console.log(currPos);
        // immediately draw the first (yellow) block because it's always at the orign
        drawCube(currPos, colors[0]);
        currPos = nextPos(currPos, direction);
        for (var i=0; i<cubes.length; i++) {
            console.log(currPos);
            drawCube(currPos, colors[i+1]);
            direction = nextDir(direction, cubes[i]);
            currPos = nextPos(currPos, direction);
        }
        drawCube(currPos, colors[i+1]);
        console.log(currPos);
    }

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
    // Cubes should be an array of length num_cubes - 2, because the 
    // orientations of the first and last cubes are irrelevant
    function testConfig(cubes) {
        if (cubes.length + 2 != num_cubes) {
            console.log("Error: cubes.length [" + cubes.length + "] != num_cubes [" + num_cubes + "] - 2");
            return;
        }

        var currPos = {x:0, y:0, z:0};
        var origin = {x:0, y:0, z:0};
        var direction = {x:1, y:0, z:0};

        for (var i=0; i<cubes.length; i++) {
            currPos = nextPos(currPos, direction);
            direction = nextDir(direction, cubes[i]);
        }
        currPos = nextPos(currPos, direction);
        return (gridDistance(currPos, origin) == 1) && (currPos.x == 0);
    }
    
    //
    // ---- Collision Grid Functions
    //

    // Number of blocks between p1 and p2, not normal distance calc
    function gridDistance(p1, p2) {
        return Math.abs(p2.x - p1.x) + Math.abs(p2.y - p1.y) + Math.abs(p2.z - p1.z);
    }

    function gridDistanceVector(p1, p2) {
        return {x: Math.abs(p2.x - p1.x),
            y: Math.abs(p2.y - p1.y),
            z: Math.abs(p2.z - p1.z)};
    } 

    function dotProduct(v1, v2) {
        return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
    }
    
    function isCollision(coord, grid) {
        // Translate negative coords to array indices to get "v"irtual
        // coordinates
        var vX = coord.x + 5;
        var vY = coord.y + 5;
        var vZ = coord.z + 5;

        return (grid[vX][vY][vZ] == 1);
    }

    function markOccupied(coord, grid) {
        var vX = coord.x + 5;
        var vY = coord.y + 5;
        var vZ = coord.z + 5;
        
        grid[vX][vY][vZ] = 1;
    }

    function markUnoccupied(coord, grid) {
        var vX = coord.x + 5;
        var vY = coord.y + 5;
        var vZ = coord.z + 5;
        
        grid[vX][vY][vZ] = 0;
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
        return grid;
    }

    //
    // ------- Depth First Search for stable configurations
    //
    //
    
    // [config] is the list of configurations until now
    //   in the beginning, should be an empty list
    // [pos] is this block's position. in the beginning, will 
    //   always be {x:1, y:0, z:0}
    // [dir] is this block's direction. in the beginning, will
    //   always be {x:1, y:0, z:0}
    function dfs(config, pos, dir, collisionGrid) {

        var origin = {x:0, y:0, z:0};
        if (config.length == num_cubes-2) {
            var dv = gridDistanceVector(origin, pos);
            var isPerpendicular = dotProduct(dv, dir) == 0;
            if (gridDistance(pos, origin) != 1) {
                console.log("rejected because not adjacent");
            } else if (!pos.x == 0) {
                console.log("rejected because adjacent on x axis");
            } else if (!isPerpendicular) {
                console.log("rejected because not perpendicular");
            } else {
                console.log("accepted... i think??");
            }
            var stable = (gridDistance(pos, origin) == 1) && (pos.x == 0) && isPerpendicular;
            return {
                isStable: stable,
                completeConfig: config
            };
        }
        var seed = Math.floor(Math.random() * 4);
        for (var i=0; i<5; i++) {
            if (i == 4) {
                return { isStable: false };
            }
            var orient = (seed + i) % 4;
            var testDir = nextDir(dir, orient);
            var testPos = nextPos(pos, testDir);
            if (isCollision(testPos, collisionGrid)) {
                continue;
            }
            markOccupied(testPos, collisionGrid);
            config.push(orient);
            var resp = dfs(config, testPos, testDir, collisionGrid);

            if (resp.isStable) {
                console.log("going home!");
                console.log(resp);
                return resp;
            }
            
            // restore the config and collision Grid
            config.pop();
            // can add an assert here if bugs exist
            markUnoccupied(testPos, collisionGrid);
        }
    }

    function init() {
        // initialize an empty grid
        var collisions = init12x12x12();

        var config = [];
        var origin = {x:0, y:0, z:0};
        var initPos = {x:1, y:0, z:0};
        var initDir = {x:1, y:0, z:0};
        markOccupied(initPos, collisions);
        drawTransientCube(origin, colors[0]);
        markOccupied(origin, collisions);
        drawTransientCube(initPos, colors[1]);
        var resp = dfs(config, initPos, initDir, collisions);
        console.log(resp.completeConfig);
        drawConfig({x:0, y:2, z:0}, resp.completeConfig, initDir);
    }

    init();
})();
