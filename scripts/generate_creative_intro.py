import os
import cv2
import numpy as np
import math

# Output configuration
OUTPUT_DIR = r"c:\Users\Dell 14 Pro PA14250\huytran-antigravity\public\videos\intro"
OUTPUT_PATH = os.path.join(OUTPUT_DIR, "creative-intro.mp4")

# Video specifications
WIDTH, HEIGHT = 1280, 720
FPS = 30
DURATION_SEC = 6.5
TOTAL_FRAMES = int(FPS * DURATION_SEC) # 195 frames

# Colors (BGR format for OpenCV)
NEON_CYAN = (254, 242, 0)
NEON_PINK = (229, 0, 255)
NEON_PURPLE = (211, 38, 192)
NEON_YELLOW = (0, 255, 255)
NEON_ORANGE = (0, 128, 255)
GOLDEN_SUN = (0, 215, 255)

# Seed for reproducible randomness
np.random.seed(2003)

# -------------------------------------------------------------
# PARTICLE SYSTEMS INITIALIZATION
# -------------------------------------------------------------

# 1. Hyperspace particles (1200 stars scattered in a 3D cylinder along Z axis)
NUM_HYPER_PARTICLES = 1200
hyper_x = np.random.uniform(-400, 400, NUM_HYPER_PARTICLES)
hyper_y = np.random.uniform(-400, 400, NUM_HYPER_PARTICLES)
hyper_z = np.random.uniform(50, 800, NUM_HYPER_PARTICLES)
hyper_colors = []
for i in range(NUM_HYPER_PARTICLES):
    r = np.random.rand()
    if r < 0.4:
        hyper_colors.append(NEON_CYAN)
    elif r < 0.7:
        hyper_colors.append(NEON_PINK)
    else:
        hyper_colors.append(NEON_PURPLE)

# 2. Spiral Galaxy Stars (6000 stars in a 3D double spiral configuration)
NUM_GALAXY_STARS = 6000
galaxy_x = []
galaxy_y = []
galaxy_z = []
galaxy_colors = []
galaxy_sizes = []

for i in range(NUM_GALAXY_STARS):
    # Two spiral arms
    arm = i % 2
    arm_offset = arm * math.pi
    
    # Distance from center
    r = np.random.uniform(5.0, 160.0)
    # Spiral angle with dispersion
    theta = 2.8 * (r / 160.0) * math.pi + arm_offset + np.random.normal(0, 0.18)
    
    x = r * math.cos(theta)
    y = r * math.sin(theta)
    z = np.random.normal(0, r * 0.05) # thinner at edge, thicker at center
    
    galaxy_x.append(x)
    galaxy_y.append(y)
    galaxy_z.append(z)
    
    # Random size
    galaxy_sizes.append(np.random.uniform(0.6, 2.2))
    
    # Core color is bright cyan/white, arms are pink/purple
    dist_ratio = r / 160.0
    if dist_ratio < 0.15:
        galaxy_colors.append((255, 255, 255)) # White hot core
    elif dist_ratio < 0.45:
        galaxy_colors.append(NEON_CYAN)
    elif dist_ratio < 0.75:
        galaxy_colors.append(NEON_PINK)
    else:
        galaxy_colors.append(NEON_PURPLE)

galaxy_x = np.array(galaxy_x)
galaxy_y = np.array(galaxy_y)
galaxy_z = np.array(galaxy_z)
galaxy_sizes = np.array(galaxy_sizes)

# 3. Solar System Planets (5 neon planets orbiting a central sun)
PLANET_DATA = [
    {"dist": 32.0,  "size": 6.0,  "color": NEON_PINK,   "speed": 0.06},
    {"dist": 48.0,  "size": 7.5,  "color": NEON_PURPLE, "speed": 0.042},
    {"dist": 72.0,  "size": 9.0,  "color": NEON_CYAN,   "speed": 0.03},
    {"dist": 96.0,  "size": 11.0, "color": NEON_YELLOW, "speed": 0.022},
    {"dist": 128.0, "size": 14.0, "color": NEON_ORANGE, "speed": 0.015}
]

# Keep orbital histories for drawing trails
planet_trails = [[] for _ in range(5)]

# -------------------------------------------------------------
# Helper Functions
# -------------------------------------------------------------
def get_camera_matrix(cam_pos, target, up=np.array([0.0, 1.0, 0.0])):
    """Computes look-at transformation matrix for 3D coordinate mapping"""
    zaxis = cam_pos - target
    zaxis /= np.linalg.norm(zaxis)
    xaxis = np.cross(up, zaxis)
    if np.linalg.norm(xaxis) < 1e-6:
        xaxis = np.array([1.0, 0.0, 0.0])
    else:
        xaxis /= np.linalg.norm(xaxis)
    yaxis = np.cross(zaxis, xaxis)
    
    R = np.vstack([xaxis, yaxis, zaxis]) # 3x3 rotation matrix
    return R, cam_pos

def project_point(P, R, cam_pos, focal_length=500.0):
    """Projects a 3D point to 2D screen coordinates using camera space matrix"""
    # Transform to camera space
    P_rel = P - cam_pos
    P_cam = np.dot(R, P_rel)
    
    # Check if point is behind camera (Z_cam >= 0 in our look-at coordinate system)
    if P_cam[2] >= -1.0:
        return None, None, None
    
    # Project to screen
    scale = focal_length / -P_cam[2]
    screen_x = int(P_cam[0] * scale + WIDTH / 2)
    screen_y = int(P_cam[1] * scale + HEIGHT / 2)
    
    return screen_x, screen_y, -P_cam[2]

def draw_radial_glow(canvas, cx, cy, radius, color, intensity=0.3):
    """Draws a smooth radial light glow patch on canvas using additive blending"""
    if cx < -radius or cx > WIDTH + radius or cy < -radius or cy > HEIGHT + radius:
        return
    
    # Bounding box of glow
    x0 = max(0, cx - radius)
    x1 = min(WIDTH, cx + radius)
    y0 = max(0, cy - radius)
    y1 = min(HEIGHT, cy + radius)
    
    if x1 <= x0 or y1 <= y0:
        return
    
    # Generate radial distance map
    grid_y, grid_x = np.ogrid[y0 - cy : y1 - cy, x0 - cx : x1 - cx]
    dist_sq = grid_x**2 + grid_y**2
    r_sq = radius**2
    
    # Gaussian-like smooth falloff profile
    glow_mask = np.exp(-dist_sq / (2 * (radius / 2.5)**2))
    glow_mask = np.clip(glow_mask * intensity, 0, 1)
    
    # Blend glow onto canvas
    roi = canvas[y0:y1, x0:x1].astype(np.float32)
    for c in range(3):
        roi[:, :, c] += glow_mask * color[c]
    
    canvas[y0:y1, x0:x1] = np.clip(roi, 0, 255).astype(np.uint8)

# -------------------------------------------------------------
# MAIN RENDER LOOP
# -------------------------------------------------------------
def main():
    # Make sure output directory exists
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # OpenCV VideoWriter setup
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    video_writer = cv2.VideoWriter(OUTPUT_PATH, fourcc, FPS, (WIDTH, HEIGHT))
    
    print(f"Starting rendering. Output will be saved to: {OUTPUT_PATH}")
    
    for f in range(TOTAL_FRAMES):
        t = f / FPS # exact time in seconds
        
        # 1. Background layer: deep space atmosphere
        # Starts pitch black (t=0 to 1), slowly develops faint colorful cosmic nebulous dust
        glow_intensity = 0.0
        if t > 0.8:
            # S-Curve fade in of background glow
            glow_intensity = (1.0 - math.cos(min(1.0, (t - 0.8) / 1.5) * math.pi)) * 0.5
            
        frame = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)
        
        if glow_intensity > 0.0:
            # Volumetric nebula background blobs (additive mixing)
            # Center purple/pink nebula
            draw_radial_glow(frame, WIDTH // 2 + int(50 * math.sin(t * 0.5)), 
                             HEIGHT // 2 + int(30 * math.cos(t * 0.4)), 
                             420, NEON_PURPLE, intensity=0.08 * glow_intensity)
            # Side cyan nebula
            draw_radial_glow(frame, WIDTH // 2 - 250 + int(70 * math.cos(t * 0.3)), 
                             HEIGHT // 2 + 100, 
                             380, NEON_CYAN, intensity=0.06 * glow_intensity)
            # Right orange nebula
            draw_radial_glow(frame, WIDTH // 2 + 300, HEIGHT // 2 - 120, 
                             350, NEON_ORANGE, intensity=0.04 * glow_intensity)
            
        # -------------------------------------------------------------
        # CAMERA PATH AND MOTION CONTROLLER (CINEMATIC EASING)
        # -------------------------------------------------------------
        # Phase 1: Frame 0-30 (0.0s to 1.0s) -> Completely pitch black & silent
        # Phase 2: Frame 30-75 (1.0s to 2.5s) -> Hyperspace rush forward (Acceleration)
        # Phase 3: Frame 75-110 (2.5s to 3.6s) -> Hyperspace deceleration and reveal
        # Phase 4: Frame 110-195 (3.6s to 6.5s) -> Slow orbit, sun flare & solar system
        
        # Default camera position
        cam_pos = np.array([0.0, 0.0, 900.0])
        target = np.array([0.0, 0.0, 0.0])
        up = np.array([0.0, 1.0, 0.0])
        
        # Hyperspace progress (0.0 to 1.0)
        hyper_progress = 0.0
        
        if t < 1.0:
            # Phase 1: Camera stands still in the void
            cam_pos = np.array([0.0, 0.0, 800.0])
        elif t < 2.5:
            # Phase 2: Camera accelerates rapidly forward along Z
            u = (t - 1.0) / 1.5 # 0.0 to 1.0
            # Easing: rapid exponential acceleration
            cam_z = 800.0 - (u**3.5) * 580.0
            cam_pos = np.array([0.0, 0.0, cam_z])
            hyper_progress = u
        elif t < 3.6:
            # Phase 3: Fast deceleration as the galaxy opens up
            u = (t - 2.5) / 1.1 # 0.0 to 1.0
            # Easing: smooth cubic deceleration
            ease_dec = 1.0 - (1.0 - u)**3
            cam_z = 220.0 - ease_dec * 120.0
            
            # Slightly tilt the camera upward to reveal the galaxy swirls majestically
            cam_x = 0.0
            cam_y = ease_dec * 45.0
            cam_pos = np.array([cam_x, cam_y, cam_z])
            
            # Smooth fade out of hyperspace particles
            hyper_progress = 1.0 - u
        else:
            # Phase 4: Majestic slow motion rotation (camera orbits planetary system)
            u = (t - 3.6) / 2.9 # 0.0 to 1.0
            
            # Orbital angles
            orbit_radius = 160.0 - u * 35.0 # slow zooming in
            angle = -0.5 * math.pi + u * 0.45 * math.pi # orbital sweep
            pitch = 45.0 - u * 20.0 # camera tilts down to a cleaner flat orbit
            
            cam_x = orbit_radius * math.cos(angle)
            cam_y = orbit_radius * math.sin(pitch * math.pi / 180.0) * math.sin(angle)
            cam_z = orbit_radius * math.cos(pitch * math.pi / 180.0) * math.sin(angle)
            
            cam_pos = np.array([cam_x, cam_y, cam_z])
            
            # Add subtle organic camera roll
            roll_angle = 0.05 * math.sin(t * 0.6)
            up = np.array([math.sin(roll_angle), math.cos(roll_angle), 0.0])
            
        # Get final view transform matrix
        R, cam_pos = get_camera_matrix(cam_pos, target, up)
        
        # -------------------------------------------------------------
        # DRAW PARTICLE SYSTEM 1: HYPERSPACE STREAKS
        # -------------------------------------------------------------
        if t >= 1.0 and t < 3.6:
            # Streaking velocity is proportional to hyper_progress
            cam_speed = 52.0 if t < 2.5 else (1.0 - (t - 2.5)/1.1) * 52.0
            
            for i in range(NUM_HYPER_PARTICLES):
                # Update particle position (coming towards camera)
                hyper_z[i] -= cam_speed
                
                # Recycle particles that pass the camera
                if hyper_z[i] < 10:
                    hyper_z[i] = np.random.uniform(700, 900)
                    hyper_x[i] = np.random.uniform(-400, 400)
                    hyper_y[i] = np.random.uniform(-400, 400)
                
                # 3D points
                P_curr = np.array([hyper_x[i], hyper_y[i], hyper_z[i]])
                P_prev = np.array([hyper_x[i], hyper_y[i], hyper_z[i] + cam_speed * 1.8]) # previous point for streaking blur
                
                # Project positions
                x_curr, y_curr, d_curr = project_point(P_curr, R, cam_pos)
                x_prev, y_prev, _ = project_point(P_prev, R, cam_pos)
                
                if x_curr is not None and x_prev is not None:
                    # Draw glowing streak line
                    # Deeper streaks are thin, closer streaks are thicker & brighter
                    thickness = int(np.clip((350.0 / d_curr) * 1.2, 1, 6))
                    alpha = float(np.clip(1.0 - (hyper_z[i] / 800.0), 0.0, 1.0)) * hyper_progress
                    
                    color = hyper_colors[i]
                    # Blend alpha with black for soft lines
                    bgr_line = (int(color[0] * alpha), int(color[1] * alpha), int(color[2] * alpha))
                    
                    # Hyperspace line sweep
                    cv2.line(frame, (x_prev, y_prev), (x_curr, y_curr), bgr_line, thickness=thickness, lineType=cv2.LINE_AA)
                    
                    # Highlight particle tip (bloom point)
                    if d_curr < 400:
                        cv2.circle(frame, (x_curr, y_curr), int(thickness * 0.8), (255, 255, 255), -1, lineType=cv2.LINE_AA)
                        
        # -------------------------------------------------------------
        # DRAW PARTICLE SYSTEM 2: MAJESTIC NEON GALAXY
        # -------------------------------------------------------------
        if t > 2.0:
            # Deceleration and orbit reveal the swirling galaxy stars
            galaxy_alpha = np.clip((t - 2.0) / 1.5, 0.0, 1.0)
            
            # Spiral rotation (differential: stars closer to core swirl faster)
            galaxy_speed = 0.32 + (t - 2.0) * 0.04
            
            for i in range(NUM_GALAXY_STARS):
                # Swirl math
                x_base = galaxy_x[i]
                y_base = galaxy_y[i]
                r_dist = math.sqrt(x_base**2 + y_base**2)
                
                # Inner stars rotate faster than outer stars (differential rotation)
                ang_vel = galaxy_speed * (15.0 / (r_dist + 15.0))
                rot_theta = ang_vel * t
                
                # Rotate coordinates
                x_rot = x_base * math.cos(rot_theta) - y_base * math.sin(rot_theta)
                y_rot = x_base * math.sin(rot_theta) + y_base * math.cos(rot_theta)
                
                P = np.array([x_rot, y_rot, galaxy_z[i]])
                sx, sy, d = project_point(P, R, cam_pos)
                
                if sx is not None and 0 <= sx < WIDTH and 0 <= sy < HEIGHT:
                    # Fade out stars that are extremely close to create smooth Depth of Field
                    dof_alpha = 1.0
                    if d < 12.0:
                        dof_alpha = np.clip((d - 4.0) / 8.0, 0.0, 1.0)
                        
                    star_alpha = galaxy_alpha * dof_alpha
                    color = galaxy_colors[i]
                    bgr_star = (int(color[0] * star_alpha), int(color[1] * star_alpha), int(color[2] * star_alpha))
                    
                    # Point size scales with distance
                    size = max(1, int(galaxy_sizes[i] * (400.0 / d)))
                    
                    if size <= 1:
                        # Single pixel optimized star
                        frame[sy, sx] = bgr_star
                    else:
                        cv2.circle(frame, (sx, sy), int(size), bgr_star, -1, lineType=cv2.LINE_AA)
                        
                        # Add a tiny glowing core to larger stars
                        if size > 3 and star_alpha > 0.6:
                            cv2.circle(frame, (sx, sy), int(size * 0.4), (255, 255, 255), -1, lineType=cv2.LINE_AA)

        # -------------------------------------------------------------
        # DRAW PARTICLE SYSTEM 3: SOLAR SYSTEM PLANETS & SUN
        # -------------------------------------------------------------
        if t > 3.0:
            system_alpha = np.clip((t - 3.0) / 1.3, 0.0, 1.0)
            
            # 1. Update and project Orbit Trails (pre-computed curves in 3D)
            for p_idx, p_info in enumerate(PLANET_DATA):
                dist = p_info["dist"]
                color = p_info["color"]
                
                # Planet's current orbital position
                p_angle = p_info["speed"] * t * 14.0 + (p_idx * 1.25)
                p_x = dist * math.cos(p_angle)
                p_y = dist * math.sin(p_angle)
                p_z = 0.0
                
                P_planet = np.array([p_x, p_y, p_z])
                
                # Record orbital history trail
                planet_trails[p_idx].append(P_planet)
                if len(planet_trails[p_idx]) > 35:
                    planet_trails[p_idx].pop(0)
                
                # Draw orbital trail curve
                trail = planet_trails[p_idx]
                if len(trail) > 1:
                    for s_idx in range(len(trail) - 1):
                        pt_curr = trail[s_idx]
                        pt_next = trail[s_idx + 1]
                        
                        scx, scy, _ = project_point(pt_curr, R, cam_pos)
                        snx, sny, _ = project_point(pt_next, R, cam_pos)
                        
                        if scx is not None and snx is not None:
                            trail_ratio = s_idx / len(trail)
                            trail_alpha = system_alpha * trail_ratio * 0.35
                            bgr_trail = (int(color[0] * trail_alpha), int(color[1] * trail_alpha), int(color[2] * trail_alpha))
                            
                            # Draw orbit curve segments
                            cv2.line(frame, (scx, scy), (snx, sny), bgr_trail, thickness=1, lineType=cv2.LINE_AA)

            # 2. Render Planets (drawn AFTER trails for correct ordering)
            for p_idx, p_info in enumerate(PLANET_DATA):
                dist = p_info["dist"]
                size = p_info["size"]
                color = p_info["color"]
                
                # Retrieve current position
                P_planet = planet_trails[p_idx][-1]
                
                psx, psy, pd = project_point(P_planet, R, cam_pos)
                
                if psx is not None:
                    # Projection diameter
                    proj_radius = max(2, int((size * (450.0 / pd))))
                    
                    # Orbit glows (additive light)
                    draw_radial_glow(frame, psx, psy, proj_radius * 3, color, intensity=0.35 * system_alpha)
                    
                    # Planet body
                    bgr_planet = (int(color[0] * system_alpha), int(color[1] * system_alpha), int(color[2] * system_alpha))
                    cv2.circle(frame, (psx, psy), proj_radius, bgr_planet, -1, lineType=cv2.LINE_AA)
                    
                    # Light reflections (glowing crests)
                    cv2.circle(frame, (psx - int(proj_radius*0.2), psy - int(proj_radius*0.2)), 
                               int(proj_radius * 0.4), (255, 255, 255), -1, lineType=cv2.LINE_AA)

            # 3. Render Central Golden Sun (Core + Flare coronas at origin)
            sun_sx, sun_sy, sun_d = project_point(np.array([0.0, 0.0, 0.0]), R, cam_pos)
            
            if sun_sx is not None:
                sun_base_radius = max(6, int((26.0 * (450.0 / sun_d))))
                
                # A. Large soft volumetric sun glow
                draw_radial_glow(frame, sun_sx, sun_sy, sun_base_radius * 6, GOLDEN_SUN, intensity=0.55 * system_alpha)
                draw_radial_glow(frame, sun_sx, sun_sy, sun_base_radius * 2, (255, 255, 255), intensity=0.45 * system_alpha)
                
                # B. Main glowing Sun Core
                cv2.circle(frame, (sun_sx, sun_sy), sun_base_radius, (int(GOLDEN_SUN[0]*system_alpha), int(GOLDEN_SUN[1]*system_alpha), int(GOLDEN_SUN[2]*system_alpha)), -1, lineType=cv2.LINE_AA)
                cv2.circle(frame, (sun_sx, sun_sy), int(sun_base_radius * 0.7), (255, 255, 255), -1, lineType=cv2.LINE_AA)
                
                # C. Volumetric solar flare rays (rotating starburst beams)
                num_rays = 6
                ray_rot_speed = t * 0.25 # slow rotation
                for r_idx in range(num_rays):
                    ray_angle = ray_rot_speed + (r_idx * (2.0 * math.pi / num_rays))
                    
                    # Ray vector
                    rx = math.cos(ray_angle)
                    ry = math.sin(ray_angle)
                    
                    # Draw soft light triangles representing sunrays
                    ray_len = sun_base_radius * 5.0
                    ray_w = sun_base_radius * 0.95
                    
                    # Build ray coordinates
                    p1 = (sun_sx, sun_sy)
                    p2 = (int(sun_sx + rx * ray_len + ry * ray_w), int(sun_sy + ry * ray_len - rx * ray_w))
                    p3 = (int(sun_sx + rx * ray_len - ry * ray_w), int(sun_sy + ry * ray_len + rx * ray_w))
                    
                    ray_pts = np.array([p1, p2, p3], dtype=np.int32)
                    
                    # Render semi-transparent additive flare beams
                    temp_layer = np.zeros_like(frame)
                    cv2.fillPoly(temp_layer, [ray_pts], (int(GOLDEN_SUN[0] * 0.16 * system_alpha), 
                                                         int(GOLDEN_SUN[1] * 0.16 * system_alpha), 
                                                         int(GOLDEN_SUN[2] * 0.16 * system_alpha)), 
                                 lineType=cv2.LINE_AA)
                    cv2.addWeighted(frame, 1.0, temp_layer, 1.0, 0, dst=frame)
                
                # D. Cinematic Lens Flare reflections along lens axis
                # Vector from Sun screen position to screen center
                screen_cx, screen_cy = WIDTH // 2, HEIGHT // 2
                vector_x = screen_cx - sun_sx
                vector_y = screen_cy - sun_sy
                
                # Multiple soft secondary flare halos at regular intervals on the axis
                flare_offsets = [0.4, 0.7, -0.3, -0.6]
                flare_colors = [NEON_CYAN, NEON_PINK, NEON_PURPLE, NEON_ORANGE]
                flare_sizes = [sun_base_radius * 0.7, sun_base_radius * 1.3, sun_base_radius * 0.4, sun_base_radius * 1.8]
                
                for f_idx, offset in enumerate(flare_offsets):
                    fx = int(sun_sx + vector_x * offset)
                    fy = int(sun_sy + vector_y * offset)
                    
                    fl_color = flare_colors[f_idx]
                    fl_radius = int(flare_sizes[f_idx])
                    
                    # Render soft flare circle ring
                    if fl_radius > 1:
                        draw_radial_glow(frame, fx, fy, fl_radius * 2, fl_color, intensity=0.18 * system_alpha)

        # -------------------------------------------------------------
        # FINAL POLISH: VIGNETTING & FADE EFFECTS
        # -------------------------------------------------------------
        # 1. Dark Vignette overlay (cinematic screen focus)
        vignette_mask = np.zeros((HEIGHT, WIDTH), dtype=np.float32)
        v_cy, v_cx = HEIGHT / 2, WIDTH / 2
        # Calculate distance to corners
        max_dist = math.sqrt(v_cx**2 + v_cy**2)
        
        # Grid of distance from center
        y_grid, x_grid = np.ogrid[:HEIGHT, :WIDTH]
        d_from_c = np.sqrt((x_grid - v_cx)**2 + (y_grid - v_cy)**2)
        
        # S-Curve Vignette mapping
        vignette_mask = 1.0 - (d_from_c / max_dist) ** 2.2
        vignette_mask = np.clip(vignette_mask, 0.12, 1.0) # don't let it become completely pitch black in middle
        
        # Blend vignette
        frame = (frame.astype(np.float32) * vignette_mask[:, :, np.newaxis]).astype(np.uint8)
        
        # 2. Master scene transition fades
        # Starts with pitch black fade out at very beginning (0.0 to 0.4s)
        # Fades out to black in the final 0.5s of the video (6.0s to 6.5s) to enable clean crossfade into WebGL Canvas
        fade_alpha = 1.0
        if t < 0.5:
            # Intro fade-in from black
            fade_alpha = t / 0.5
        elif t > 6.0:
            # Outro fade-out to black
            fade_alpha = 1.0 - ((t - 6.0) / 0.5)
            
        if fade_alpha < 1.0:
            frame = (frame.astype(np.float32) * fade_alpha).astype(np.uint8)

        # Write finished frame to MP4 stream
        video_writer.write(frame)
        
        # Display progress every 15 frames
        if f % 15 == 0:
            print(f"Render progress: Frame {f}/{TOTAL_FRAMES} ({(f/TOTAL_FRAMES)*100:.1f}%)")

    # Release file handle
    video_writer.release()
    print(f"Video generation successful! Video saved at: {OUTPUT_PATH}")

if __name__ == "__main__":
    main()
