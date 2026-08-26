# Veyra privacy insert integration findings

The user-provided `veyra_privacy_cinematic_insert.mp4` was copied into the persistent Veyra media archive and integrated into the preserved corrected submission cut.

The first integration attempt did not display the insert because the overlay input ended before the enable window. The renderer was corrected by offsetting the insert timestamps to the intended 42–50 second interval. Visual QA now confirms the insert appears as a copper-bordered 640x360 inset over the real Private Primitives page, with a dark lower label reading `CONCEPTUAL PRIVACY MODEL`. The real page remains visible behind it, and the uploaded insert’s conceptual nature is not presented as live evidence.

The integrated output is `/home/ubuntu/webdev-static-assets/veyra-demo-v2/integrated/veyra_submission_judge_cut_90s_with_privacy_insert.mp4`. It is 90.000 seconds, 1920x1080, 60fps, with one H.264 video stream and one AAC audio stream, preserving the corrected 90-second ending and narration.
