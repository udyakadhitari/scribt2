import React from 'react';
import type { UIStack } from './types.js';
interface DetailPaneProps {
    stack: UIStack | undefined;
    isEditing: boolean;
    onRouteChanged: (value: string) => void;
    onSubmit: () => void;
}
export declare const DetailPane: React.FC<DetailPaneProps>;
export {};
