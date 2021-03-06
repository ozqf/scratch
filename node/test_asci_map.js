const asci3 = `################################################################
#################...###...######################################
#################...#.......####################################
#################.................#########################...##
#################...#...#.........#########################....#
#################....####...x  ...################...###.......#
##################...##...##x   .#################.............#
##################........#     .#################...###..   ..#
#######################...#  x. ##################.   #      ..#
###########################   . ..#############....     x    ..#
############################x#. xx#############....   #x     ###
############################ x    #############...   ....# xx  #
#########..#################    x  ############...   ....#   x #
######x x..#####   ##########      ############...   ....#   x##
######    ....      xxx########  x ############..     ###   ####
######    ..   x      x            x           x  x   ..#x######
#######x  ..    x ###   ####### ###############       ..# ######
#######           ###     x####   ############ex  ###x..# ######
#######...## ##   ######     ## # ############ x ####     ######
#######...# x    x######     ## # ###################     ######
########.#.    x x  ######   ## # ####################   #######
########...   xxx   ####### x #x#x  ############################
#######......##     #######   # ##  ###...##...#################
#####.......###     ##k         ##  #     .....#################
#####......####     #####             s   ......################
#####...#..#####      ### xx  x      .. x ........###########.##
####....#...####      ####     x     ...#####.....##...######.##
####....###....     xx       x.. .x  ##########....#...######.##
####..###......   # x ###        ## ##############.....###....##
#########......    k#####  x     x   #############.....###....##
#########...#############  x       x ##############..........###
################################################################
`;

function scanString(src) {
	const len = src.length;
	console.log(`Scan ${len} chars`);
	let mobs = 0;
	for (let i = 0; i < len; ++i) {
		let c = src[i];
		if (c == 'x') {
			mobs += 1;
		}
	}
	console.log(`${mobs} mobs`);
}

scanString(asci3);
