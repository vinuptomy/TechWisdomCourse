import React, { FC, SVGProps } from 'react';

// FIX: The base SVGProps<SVGSVGElement> contains a 'path' attribute of type 'string | undefined'.
// This conflicts with our desired 'path' prop which can be 'string | string[]'.
// By using Omit, we remove the original 'path' and define our own, resolving the type conflict.
const Icon = ({ path, ...props }: Omit<SVGProps<SVGSVGElement>, 'path'> & { path: string | string[] }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {Array.isArray(path) ? path.map((p, i) => <path key={i} d={p} />) : <path d={path} />}
    </svg>
);

export const CommunityIcon = (props: SVGProps<SVGSVGElement>) => <Icon path={["M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2", "M9 7 a4 4 0 1 0 0 -8 a4 4 0 1 0 0 8z", "M23 21v-2a4 4 0 0 0-3-3.87", "M16 3.13a4 4 0 0 1 0 7.75"]} {...props}/>;
export const ClassroomIcon = (props: SVGProps<SVGSVGElement>) => <Icon path={["M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z", "M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"]} {...props}/>;
export const DownloadIcon = (props: SVGProps<SVGSVGElement>) => <Icon path={["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "m7 10 5 5 5-5", "M12 15V3"]} {...props}/>;
export const SettingsIcon = (props: SVGProps<SVGSVGElement>) => <Icon path={["M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z", "M12 12 a3 3 0 1 0 0 -6 a3 3 0 1 0 0 6z"]} {...props}/>;
export const LockIcon = (props: SVGProps<SVGSVGElement>) => <Icon path={["M16 20V10a4 4 0 1 0-8 0v10", "M3 11h18v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"]} {...props}/>;
export const LogoutIcon = (props: SVGProps<SVGSVGElement>) => <Icon path={["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "m16 17 5-5-5-5", "M21 12H9"]} {...props}/>;
export const AiIcon = (props: SVGProps<SVGSVGElement>) => <Icon path={["M12 8V4H8", "M4 8h16v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z", "M2 14h2", "M20 14h2", "M15 13v2", "M9 13v2"]} {...props}/>;
export const SendIcon = (props: SVGProps<SVGSVGElement>) => <Icon path={["m22 2-7 20-4-9-9-4 20-7z", "M22 2 11 13"]} {...props} />;
export const CloseIcon = (props: SVGProps<SVGSVGElement>) => <Icon path={["m18 6-12 12", "m6 6 12 12"]} {...props}/>;
// FIX: Converted the single path string into an array of strings for better parsing robustness.
// The original format, while technically valid, can be brittle in some SVG renderers.
export const LikeIcon = (props: SVGProps<SVGSVGElement>) => <Icon path={["M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3z", "M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"]} {...props}/>;
export const CommentIcon = (props: SVGProps<SVGSVGElement>) => <Icon path="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" {...props}/>;
export const BackIcon = (props: SVGProps<SVGSVGElement>) => <Icon path={["M19 12H5", "M12 19l-7-7 7-7"]} {...props}/>;
export const SearchIcon = (props: SVGProps<SVGSVGElement>) => <Icon path={["M10 10 m -7 0 a 7 7 0 1 0 14 0 a 7 7 0 1 0 -14 0", "m21 21-4.3-4.3"]} {...props}/>;
// FIX: The original path string was syntactically incorrect, missing spaces between drawing commands.
// This was causing the SVG renderer to fail and crash the application.
// Split the commands into a string array for correctness and robustness.
export const MenuIcon = (props: SVGProps<SVGSVGElement>) => <Icon path={["M3 12h18", "M3 6h18", "M3 18h18"]} {...props}/>;