# Veyra submission ending-fix findings

The uploaded `/home/ubuntu/upload/veyra_submission_judge_cut_90s.mp4` is 90 seconds at 1920x1080 and 60fps, but its AAC stream is only 70.4 seconds, leaving the ending silent. The corrected output is `/home/ubuntu/webdev-static-assets/veyra-demo-v2/ending-fix/veyra_submission_judge_cut_90s_corrected.mp4`.

The correction appends a spoken Veyra operating-model outro after the existing narration and trims/mixes the result to exactly 90 seconds. The output video and audio streams are each 90 seconds. A deterministic closing card was rendered from the authoritative `client/src/components/VeyraBrand.tsx` shield paths and wordmark, then used for the final ten seconds. Visual QA at 85 seconds shows the correct Veyra shield, wordmark, and private-financial-coordination descriptor on the dark closing card.
