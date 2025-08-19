"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSVG = generateSVG;
// Configuration
const PADDING = 15; // Padding around the canvas in pixels
const PADDLE_WIDTH = 75; // Paddle width in pixels
const PADDLE_HEIGHT = 10; // Paddle height in pixels
const PADDLE_RADIUS = 5; // Paddle corner radius in pixels
const PADDLE_BRICK_GAP = 100; // Gap between the last row of bricks and the paddle in pixels
const BALL_RADIUS = 8; // Ball radius in pixels
const BRICK_SIZE = 12; // Brick size in pixels
const BRICK_GAP = 3; // Gap between bricks in pixels
const BRICK_RADIUS = 3; // Radius for rounded corners of bricks
const ANIMATE_STEP = 1; // Step size for animation frames
const SECONDS_PER_FRAME = 1 / 30; // Duration of each frame in seconds (30 FPS)
const MAX_FRAMES = 30000; // Maximum number of frames to simulate
const BALL_SPEED = 10; // Speed of the ball in pixels per frame
// GitHub contribution graph green palettes
const GITHUB_GREENS_DARK = [
    "#151B23",
    "#033A16",
    "#196C2E",
    "#2EA043",
    "#56D364",
];
// Map from light palette color to dark palette color (the GraphQL API returns light colors and does not handle dark mode)
const LIGHT_TO_DARK_COLOR_MAP = {
    "#ebedf0": "#151B23",
    "#9be9a8": "#033A16",
    "#40c463": "#196C2E",
    "#30a14e": "#2EA043",
    "#216e39": "#56D364",
};
/**
 * Fetches the GitHub contributions calendar for a user using the GraphQL API.
 *
 * @param userName - The GitHub username to fetch contributions for.
 * @param githubToken - A GitHub personal access token with appropriate permissions.
 * @returns A 2D array representing weeks and days, where each element contains the color string or null.
 * @throws Will throw an error if the API request fails or returns errors.
 */
function fetchGithubContributionsGraphQL(userName, githubToken) {
    return __awaiter(this, void 0, void 0, function* () {
        const query = `
    query($userName:String!) {
      user(login: $userName){
        contributionsCollection {
          contributionCalendar {
            weeks {
              contributionDays {
                color
              }
            }
          }
        }
      }
    }`;
        const res = yield fetch("https://api.github.com/graphql", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `bearer ${githubToken}`,
            },
            body: JSON.stringify({
                query,
                variables: { userName },
            }),
        });
        if (!res.ok) {
            throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
        }
        const json = yield res.json();
        if (json.errors) {
            throw new Error("GitHub GraphQL error: " + JSON.stringify(json.errors));
        }
        // Format the contribution days into a 2D array of colors (weeks x days)
        const weeks = json.data.user.contributionsCollection.contributionCalendar.weeks;
        const colors = [];
        for (let c = 0; c < weeks.length; c++) {
            colors[c] = [];
            const days = weeks[c].contributionDays;
            for (let r = 0; r < days.length; r++) {
                colors[c][r] = days[r].color;
            }
        }
        return colors;
    });
}
/**
 * Checks if a circle and a rectangle are colliding.
 *
 * @param circleX - The x-coordinate of the circle's center.
 * @param circleY - The y-coordinate of the circle's center.
 * @param circleRadius - The radius of the circle.
 * @param rectX - The x-coordinate of the rectangle's top-left corner.
 * @param rectY - The y-coordinate of the rectangle's top-left corner.
 * @param rectWidth - The width of the rectangle.
 * @param rectHeight - The height of the rectangle.
 * @returns True if the circle and rectangle are colliding, false otherwise.
 */
function circleRectCollision(circleX, circleY, circleRadius, rectX, rectY, rectWidth, rectHeight) {
    const closestX = Math.max(rectX, Math.min(circleX, rectX + rectWidth));
    const closestY = Math.max(rectY, Math.min(circleY, rectY + rectHeight));
    const dx = circleX - closestX;
    const dy = circleY - closestY;
    return dx * dx + dy * dy <= circleRadius * circleRadius;
}
/**
 * Simulates the movement of the ball, paddle, and bricks for a breakout-style game.
 *
 * @param bricks - The initial array of bricks to simulate.
 * @param canvasWidth - The width of the canvas.
 * @param canvasHeight - The height of the canvas.
 * @param paddleY - The vertical position of the paddle.
 * @returns An array of frame states representing the simulation history.
 */
function simulate(bricks, canvasWidth, canvasHeight, paddleY) {
    // Initialize ball position at the center bottom of the canvas
    let ballX = canvasWidth / 2;
    let ballY = canvasHeight - 30;
    // Set the initial launch angle and calculate velocity components
    let launchAngle = -Math.PI / 4;
    let ballVelocityX = BALL_SPEED * Math.cos(launchAngle);
    let ballVelocityY = BALL_SPEED * Math.sin(launchAngle);
    // Create a copy of the bricks' array to simulate on
    const simulatedBricks = bricks.map((brick) => (Object.assign({}, brick)));
    // Array to store the state of each frame
    const frameHistory = [];
    let currentFrame = 0;
    // Initialize paddle position at the center
    let paddlePositionX = (canvasWidth - PADDLE_WIDTH) / 2;
    // Main simulation loop
    while (simulatedBricks.some((brick) => brick.status === "visible") &&
        currentFrame < MAX_FRAMES) {
        // Move paddle to follow the ball, clamped within canvas bounds (respect padding)
        paddlePositionX = Math.max(PADDING, Math.min(canvasWidth - PADDING - PADDLE_WIDTH, ballX - PADDLE_WIDTH / 2));
        // Update ball position
        ballX += ballVelocityX;
        ballY += ballVelocityY;
        // Ball collision with left or right wall (respect padding)
        if (ballX + ballVelocityX > canvasWidth - PADDING - BALL_RADIUS ||
            ballX + ballVelocityX < PADDING + BALL_RADIUS) {
            ballVelocityX = -ballVelocityX;
        }
        // Ball collision with top wall (respect padding)
        if (ballY + ballVelocityY < PADDING + BALL_RADIUS) {
            ballVelocityY = -ballVelocityY;
        }
        // Ball collision with paddle
        const ballNextBottom = ballY + ballVelocityY + BALL_RADIUS;
        if (ballVelocityY > 0 &&
            ballNextBottom >= paddleY &&
            ballY + BALL_RADIUS <= paddleY // was above paddle
        ) {
            ballVelocityY = -Math.abs(ballVelocityY);
            // Place the ball just at the paddle edge to prevent overlap
            ballY = paddleY - BALL_RADIUS;
        }
        // Ball collision with bricks
        for (let i = 0; i < simulatedBricks.length; i++) {
            const brick = simulatedBricks[i];
            if (brick.status === "visible" &&
                circleRectCollision(ballX, ballY, BALL_RADIUS, brick.x, brick.y, BRICK_SIZE, BRICK_SIZE)) {
                ballVelocityY = -ballVelocityY;
                brick.status = "hidden";
                break;
            }
        }
        // Prevent the ball from entering the padding on all sides
        ballX = Math.max(PADDING + BALL_RADIUS, Math.min(canvasWidth - PADDING - BALL_RADIUS, ballX));
        ballY = Math.max(PADDING + BALL_RADIUS, Math.min(canvasHeight - PADDING - BALL_RADIUS, ballY));
        // Store the frame state at each ANIMATE_STEP interval
        if (currentFrame % ANIMATE_STEP === 0) {
            frameHistory.push({
                ballX: ballX,
                ballY: ballY,
                paddleX: paddlePositionX,
                bricks: simulatedBricks.map((brick) => brick.status),
            });
        }
        currentFrame++;
    }
    // Return the history of all frames
    return frameHistory;
}
/**
 * Converts an array of numbers to a semicolon-separated string with each number formatted to one decimal place.
 * It's used to create the values for SVG animations.
 *
 * @param arr - The array of numbers to format.
 * @returns The formatted string of numbers separated by semicolons.
 */
function getAnimValues(arr) {
    return arr.map((v) => v.toFixed(1)).join(";");
}
/**
 * Minifies an SVG string by removing unnecessary whitespace, line breaks, and spaces between tags.
 *
 * @param svg - The SVG string to minify.
 * @returns The minified SVG string.
 */
function minifySVG(svg) {
    return svg
        .replace(/\s{2,}/g, " ")
        .replace(/>\s+</g, "><")
        .replace(/\n/g, "");
}
/**
 * Generates a minified SVG string representing a GitHub contributions as a Breakout game animation.
 *
 * @param username - The GitHub username to fetch contributions for.
 * @param githubToken - The GitHub token used for authentication.
 * @param [darkMode=false] - Whether to use dark mode.
 * @returns A promise that resolves to the minified SVG string.
 */
function generateSVG(username_1, githubToken_1) {
    return __awaiter(this, arguments, void 0, function* (username, githubToken, darkMode = false) {
        const colors = yield fetchGithubContributionsGraphQL(username, githubToken);
        // The number of columns (weeks) is determined by the API response
        const brickColumnCount = colors.length;
        // Calculate canvasWidth and canvasHeight dynamically
        const canvasWidth = brickColumnCount * (BRICK_SIZE + BRICK_GAP) + PADDING * 2 - BRICK_GAP; // right edge flush
        // Bricks area height
        const bricksTotalHeight = 7 * (BRICK_SIZE + BRICK_GAP) - BRICK_GAP;
        // Calculate the vertical position of the paddle
        // The paddle sits below the last row of bricks plus the user-specified gap
        const paddleY = PADDING + bricksTotalHeight + PADDLE_BRICK_GAP;
        // Calculate the total canvas height
        // The ball and paddle should have enough space at the bottom (add a little margin)
        const canvasHeight = paddleY + PADDLE_HEIGHT + PADDING;
        // Build bricks with correct color (API color for light, mapped for dark), skip missing days (null color)
        const bricks = [];
        for (let c = 0; c < brickColumnCount; c++) {
            for (let r = 0; r < 7; r++) {
                let dayColor = (colors[c] && colors[c][r]) || null;
                if (!dayColor) {
                    continue; // skip bricks for missing days
                }
                if (darkMode) {
                    dayColor =
                        LIGHT_TO_DARK_COLOR_MAP[dayColor.toLowerCase()] ||
                            GITHUB_GREENS_DARK[0];
                }
                bricks.push({
                    x: c * (BRICK_SIZE + BRICK_GAP) + PADDING,
                    y: r * (BRICK_SIZE + BRICK_GAP) + PADDING,
                    color: dayColor,
                    status: "visible",
                });
            }
        }
        // Run the simulation
        const states = simulate(bricks, canvasWidth, canvasHeight, paddleY);
        const animationDuration = states.length * SECONDS_PER_FRAME * ANIMATE_STEP;
        // Extract the X positions of the ball from each state
        const ballX = states.map((s) => s.ballX);
        // Extract the Y positions of the ball from each state
        const ballY = states.map((s) => s.ballY);
        // Extract the X positions of the paddle from each state
        const paddleX = states.map((s) => s.paddleX);
        // Prepare animation data for each brick
        const brickAnimData = bricks.map((_, i) => {
            let firstZero = -1;
            // Find the first frame where the brick is not visible
            for (let f = 0; f < states.length; ++f) {
                if (states[f].bricks[i] !== "visible") {
                    firstZero = f;
                    break;
                }
            }
            if (firstZero === -1) {
                // Brick is always visible
                return { animate: false, opacity: 1 };
            }
            else {
                // Brick disappears at frame firstZero
                const t = firstZero / (states.length - 1);
                const keyTimes = `0;${t.toFixed(4)};${t.toFixed(4)};1`;
                const values = "1;1;0;0";
                return { animate: true, keyTimes, values };
            }
        });
        // Generate keyTimes string for animation steps
        const keyTimes = Array.from({ length: states.length }, (_, i) => (i / (states.length - 1)).toFixed(4)).join(";");
        // Build the SVG string with animated bricks, paddle, and ball
        const svg = `
<svg width="${canvasWidth}" height="${canvasHeight}" viewBox="0 0 ${canvasWidth} ${canvasHeight}" xmlns="http://www.w3.org/2000/svg">
  ${bricks
            .map((brick, i) => {
            const anim = brickAnimData[i];
            if (!anim.animate) {
                // Static brick (never disappears)
                return `<rect x="${brick.x}" y="${brick.y}" width="${BRICK_SIZE}" height="${BRICK_SIZE}" rx="${BRICK_RADIUS}" fill="${brick.color}" opacity="1"/>`;
            }
            // Animated brick (disappears at some point)
            return `<rect x="${brick.x}" y="${brick.y}" width="${BRICK_SIZE}" height="${BRICK_SIZE}" rx="${BRICK_RADIUS}" fill="${brick.color}">
        <animate attributeName="opacity"
          values="${anim.values}"
          keyTimes="${anim.keyTimes}"
          dur="${animationDuration}s"
          fill="freeze"
          repeatCount="indefinite"/>
      </rect>`;
        })
            .join("")}
  <rect y="${paddleY}" width="${PADDLE_WIDTH}" height="${PADDLE_HEIGHT}" rx="${PADDLE_RADIUS}" fill="#1F6FEB">
    <!-- Animate paddle X position -->
    <animate attributeName="x" values="${getAnimValues(paddleX)}" keyTimes="${keyTimes}" dur="${animationDuration}s" repeatCount="indefinite"/>
  </rect>
  <circle r="${BALL_RADIUS}" fill="#1F6FEB">
    <!-- Animate ball X and Y positions -->
    <animate attributeName="cx" values="${getAnimValues(ballX)}" keyTimes="${keyTimes}" dur="${animationDuration}s" repeatCount="indefinite"/>
    <animate attributeName="cy" values="${getAnimValues(ballY)}" keyTimes="${keyTimes}" dur="${animationDuration}s" repeatCount="indefinite"/>
  </circle>
</svg>
    `.trim();
        // Minify and return the SVG string
        return minifySVG(svg);
    });
}
