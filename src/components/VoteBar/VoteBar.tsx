// Add a small blur amount (adjustable as needed)
const blurAmount = 4; // Smaller value for better handling of edge cases
const minBlurAmount = 2; // Minimum blur amount to ensure smooth transitions

export default function VoteBar({ approvals, rejections, nulls, total }: { approvals: number; rejections: number; nulls: number, total: number }) {
    // Calculate total votes
    const votesTotal = approvals + rejections + nulls;
    
    // Handle case with no votes
    if (votesTotal === 0) {
        return <div className="w-full rounded-full h-3 border border-algo-black dark:border-white bg-algo-black-60"></div>;
    }
    
    // Calculate percentage positions for gradient stops - FIXED CALCULATION
    const approvalsPercent = Math.max(0, (approvals / votesTotal) * 100);
    const nullsPercent = approvalsPercent + (nulls / votesTotal) * 100;
    // Rejections now go from nullsPercent to 100%
    
    // Build gradient based on non-zero categories
    let gradientStyle = '';
    let darkGradientStyle = '';
    
    if (approvals === 0 && rejections === 0) {
        // Only nulls - solid orange (was red before)
        gradientStyle = `linear-gradient(90deg, black 0%, black 100%)`;
        darkGradientStyle = `linear-gradient(90deg, black 0%, black 100%)`;
    } else if (approvals === 0 && nulls === 0) {
        // Only rejections - solid red
        gradientStyle = `linear-gradient(90deg, red 0%, red 100%)`;
        darkGradientStyle = `linear-gradient(90deg, red 0%, red 100%)`;
    } else if (rejections === 0 && nulls === 0) {
        // Only approvals - solid blue
        gradientStyle = `linear-gradient(90deg, #2D2DF1 0%, #2D2DF1 100%)`;
        darkGradientStyle = `linear-gradient(90deg, #17CAC6 0%, #17CAC6 100%)`;
    } else {
        // Calculate adjusted blur amount based on segment sizes
        const minSegmentSize = Math.min(
            approvals > 0 ? approvalsPercent : 100,
            nulls > 0 ? (nullsPercent - approvalsPercent) : 100,
            rejections > 0 ? (100 - nullsPercent) : 100
        );
        
        // Use dynamic blur (smaller for small segments)
        const adjustedBlur = Math.max(minBlurAmount, Math.min(blurAmount, minSegmentSize / 2));
        
        if (approvals === 0) {
            // No approvals - start with orange (nulls)
            gradientStyle = `linear-gradient(90deg, 
                black 0%, 
                black ${Math.max(0, nullsPercent - adjustedBlur)}%, 
                red ${Math.min(100, nullsPercent + adjustedBlur)}%, 
                red 100%)`;
            darkGradientStyle = gradientStyle;
        } else if (rejections === 0) {
            // No rejections - transition from blue to orange (no red)
            gradientStyle = `linear-gradient(90deg, 
                #2D2DF1 0%, 
                #2D2DF1 ${Math.max(0, approvalsPercent - adjustedBlur)}%, 
                black ${Math.min(100, approvalsPercent + adjustedBlur)}%, 
                black 100%)`;
            darkGradientStyle = `linear-gradient(90deg, 
                #17CAC6 0%, 
                #17CAC6 ${Math.max(0, approvalsPercent - adjustedBlur)}%, 
                black ${Math.min(100, approvalsPercent + adjustedBlur)}%, 
                black 100%)`;
        } else if (nulls === 0) {
            // No nulls - transition directly from blue to red
            gradientStyle = `linear-gradient(90deg, 
                #2D2DF1 0%, 
                #2D2DF1 ${Math.max(0, approvalsPercent - adjustedBlur)}%, 
                red ${Math.min(100, approvalsPercent + adjustedBlur)}%, 
                red 100%)`;
            darkGradientStyle = `linear-gradient(90deg, 
                #17CAC6 0%, 
                #17CAC6 ${Math.max(0, approvalsPercent - adjustedBlur)}%, 
                red ${Math.min(100, approvalsPercent + adjustedBlur)}%, 
                red 100%)`;
        } else {
            // All three types present - full gradient with FIXED COLOR ORDER
            gradientStyle = `linear-gradient(90deg, 
                #2D2DF1 0%, 
                #2D2DF1 ${Math.max(0, approvalsPercent - adjustedBlur)}%, 
                black ${Math.min(100, approvalsPercent + adjustedBlur)}%, 
                black ${Math.max(0, nullsPercent - adjustedBlur)}%, 
                red ${Math.min(100, nullsPercent + adjustedBlur)}%, 
                red 100%)`;
            darkGradientStyle = `linear-gradient(90deg, 
                #17CAC6 0%, 
                #17CAC6 ${Math.max(0, approvalsPercent - adjustedBlur)}%, 
                black ${Math.min(100, approvalsPercent + adjustedBlur)}%, 
                black ${Math.max(0, nullsPercent - adjustedBlur)}%, 
                red ${Math.min(100, nullsPercent + adjustedBlur)}%, 
                red 100%)`;
        }
    }

    // Calculate the percentage width for the progress bar
    const progressWidth = total > 0 && votesTotal > 0 ? 
        `${Math.min(100, (votesTotal / total) * 100)}%` : '100%';
    
    return (
        <div className="relative w-full">
            <div className="w-full rounded-full h-3 bg-algo-black-60"></div>
            <div
                style={{
                    backgroundImage: darkGradientStyle,
                    width: progressWidth,
                    transition: 'width 0.3s ease-in-out',
                }}
                className="hidden absolute left-0 top-0 dark:block h-3 border border-white rounded-full"
            ></div>
            <div
                style={{
                    backgroundImage: gradientStyle,
                    width: progressWidth,
                    transition: 'width 0.3s ease-in-out',
                }}
                className="absolute left-0 top-0 dark:hidden h-3 border border-algo-black rounded-full"
            ></div>
        </div>
    );
}