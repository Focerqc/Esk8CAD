import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AttributeTooltipProps {
    value: any;
    unit: string;
    children: React.ReactNode;
}

const AttributeTooltip: React.FC<AttributeTooltipProps> = ({ value, unit, children }) => {
    const [isHovered, setIsHovered] = useState(false);

    const getConversion = () => {
        if (typeof value !== 'number' && isNaN(Number(value))) return null;
        
        const numValue = Number(value);
        const lowerUnit = unit.toLowerCase().trim();

        if (['mm', 'cm', 'm'].includes(lowerUnit)) {
            // Metric Dimension to Imperial
            let mmValue = numValue;
            if (lowerUnit === 'cm') mmValue = numValue * 10;
            if (lowerUnit === 'm') mmValue = numValue * 1000;
            const inches = (mmValue / 25.4).toFixed(2);
            return `${inches} in`;
        }

        if (['in', 'inch', '"'].includes(lowerUnit)) {
            // Imperial Dimension to Metric
            const mm = (numValue * 25.4).toFixed(1);
            return `${mm} mm`;
        }

        if (['kg', 'g'].includes(lowerUnit)) {
            // Metric Weight to Imperial
            let kgValue = numValue;
            if (lowerUnit === 'g') kgValue = numValue / 1000;
            const lbs = (kgValue / 0.453592).toFixed(2);
            return `${lbs} lb`;
        }

        if (['lb', 'lbs', 'oz'].includes(lowerUnit)) {
            // Imperial Weight to Metric
            let kgValue = numValue * 0.453592;
            if (lowerUnit === 'oz') kgValue = numValue * 0.0283495;
            const kg = kgValue.toFixed(2);
            return `${kg} kg`;
        }

        return null;
    };

    const conversion = getConversion();
    if (!conversion) return <>{children}</>;

    return (
        <div 
            className="position-relative d-inline-block"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {children}
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, y: 5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="position-absolute start-50 translate-middle-x mb-2 shadow-lg z-index-10"
                        style={{ 
                            bottom: '100%',
                            whiteSpace: 'nowrap',
                            backgroundColor: '#18181b', // Zinc-900/800
                            color: '#22d3ee', // Cyan-400
                            fontSize: '0.65rem',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            pointerEvents: 'none'
                        }}
                    >
                        {conversion}
                        {/* Triangle arrow */}
                        <div className="position-absolute start-50 translate-middle-x" style={{
                            bottom: '-5px',
                            width: 0,
                            height: 0,
                            borderLeft: '5px solid transparent',
                            borderRight: '5px solid transparent',
                            borderTop: '5px solid #18181b'
                        }} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AttributeTooltip;
