import Konva from "konva";
import NodeWrapper from "./NodeWrapper";
import SelectableObject from "./SelectableObject";
import StateManager from "./StateManager";
import { Tool } from "./Tool";
import TokenWrapper from "./TokenWrapper";
import { v4 as uuidv4 } from 'uuid';

export default class TransitionWrapper extends SelectableObject {
    public static readonly ExtraTransitionArrowPadding = 5;

    private static readonly SelectedArrowColor = 'red';
    private static readonly ArrowColor = 'black';

    private arrowObject: Konva.Arrow;
    private labelObject: Konva.Text;
    private labelCenterDebugObject: Konva.Circle;
    public konvaGroup: Konva.Group;

    private _sourceNode: NodeWrapper;
    transitionId: string;
    isCurved: boolean;
    priority: string;
    public get sourceNode() { return this._sourceNode; }

    private _destNode: NodeWrapper;
    public get destNode() { return this._destNode; }

    private _tokens: Set<TokenWrapper>;

    private _isEpsilonTransition: boolean;

    private readonly _id: string
    public get id() {
        return this._id;
    }

    constructor(sourceNode: NodeWrapper, destNode: NodeWrapper, isEpsilonTransition: boolean | null = null, tokens: Array<TokenWrapper> | Set<TokenWrapper> | null = null) {
        console.log('inside the constructor');
        super();
        this._id = uuidv4();
        this._sourceNode = sourceNode;
        this._destNode = destNode;
        this._tokens = new Set(tokens) ?? new Set<TokenWrapper>();
        this._isEpsilonTransition = isEpsilonTransition ?? false;

        const existingTransitions = StateManager.transitions.filter(t => 
            (t.sourceNode.id === sourceNode.id && t.destNode.id === destNode.id) ||
            (t.sourceNode.id === destNode.id && t.destNode.id === sourceNode.id)
        );

        //this.priority = existingTransitions.length === 0 ? 'first' : 'second';
        if(existingTransitions.length === 0){
            this.priority = 'straight';
        } else {
            existingTransitions[0].priority = 'first';
            this.priority = 'second';
            existingTransitions[0].updatePoints();
        }

        this.konvaGroup = new Konva.Group();

        this.arrowObject = new Konva.Arrow({
            x: 0,
            y: 0,
            points: [0, 0, 0, 0],
            stroke: StateManager.colorScheme.transitionArrowColor,
            fill: StateManager.colorScheme.transitionArrowColor,
            strokeWidth: 5,
            lineJoin: 'round',
            pointerLength: 10,
            pointerWidth: 10,
        });

        this.labelCenterDebugObject = new Konva.Circle({
            x: 0,
            y: 0,
            radius: 3,
            fill: 'magenta'
        });

        this.labelObject = new Konva.Text({
            x: 0,
            y: 0,
            align: 'center',
            verticalAlign: 'middle',
            text: 'label here',
            fontSize: 20,
            fill: StateManager.colorScheme.transitionLabelColor,
        });

        this.konvaGroup.add(this.arrowObject);
        this.konvaGroup.add(this.labelCenterDebugObject);
        this.konvaGroup.add(this.labelObject);

        this.updatePoints();

        this.konvaGroup.on('click', (ev) => this.onClick.call(this, ev));
        this._sourceNode.nodeGroup.on('move.transition', (ev) => this.updatePoints.call(this));
        this._destNode.nodeGroup.on('move.transition', (ev) => this.updatePoints.call(this));
    }

    private resetLabel() {
        let text = [];
        if (this.isEpsilonTransition) {
            text.push("ε");
        }

        this._tokens.forEach(tok => text.push(tok.symbol));
        this.labelObject.text(text.join(','));
    }

    public updatePoints() {
        this.resetLabel();
    
        // If source node and destination node are the same,
        // then the transition arrow should loop up and around
        if (this._sourceNode == this._destNode) {
            console.log('source node and dest node are the same!');
            let srcPos = this._sourceNode.nodeGroup.position();
            const ANGLE = 60.0 * (Math.PI / 180.0);
            const DIST = 30;
    
            const centerPtX = srcPos.x;
            const centerPtY = srcPos.y - NodeWrapper.NodeRadius - DIST * 1.5;
    
            let pointsArray = [
                srcPos.x + NodeWrapper.NodeRadius * Math.cos(ANGLE),
                srcPos.y - NodeWrapper.NodeRadius * Math.sin(ANGLE),
    
                srcPos.x + NodeWrapper.NodeRadius * Math.cos(ANGLE) + DIST * Math.cos(ANGLE),
                srcPos.y - NodeWrapper.NodeRadius * Math.sin(ANGLE) - DIST * Math.sin(ANGLE),
    
                centerPtX,
                centerPtY,
    
                srcPos.x - NodeWrapper.NodeRadius * Math.cos(ANGLE) - DIST * Math.cos(ANGLE),
                srcPos.y - NodeWrapper.NodeRadius * Math.sin(ANGLE) - DIST * Math.sin(ANGLE),
    
                srcPos.x - NodeWrapper.NodeRadius * Math.cos(ANGLE) - TransitionWrapper.ExtraTransitionArrowPadding * Math.cos(ANGLE),
                srcPos.y - NodeWrapper.NodeRadius * Math.sin(ANGLE) - TransitionWrapper.ExtraTransitionArrowPadding * Math.sin(ANGLE)
            ];
            this.arrowObject.points(pointsArray);
            this.arrowObject.tension(0); 
    
            this.labelObject.position({x: centerPtX, y: centerPtY});
            this.labelCenterDebugObject.position({x: centerPtX, y: centerPtY});
    
            return;
        }
    
        let srcPos = this._sourceNode.nodeGroup.position();
        let dstPos = this._destNode.nodeGroup.position();

        if (this.priority === 'second' || this.priority === 'first') {
            console.log('Curved arrow logic executed!');
            const angleAdjustment = this.priority === 'second' ? 1.571 : -1.571;
            //const controlPointX = (srcPos.x + dstPos.x) / 2;
            //const controlPointY = (srcPos.y + dstPos.y) / 2 - offset;
            //const midX = (srcPos.x + dstPos.x) / 2;
            //const midY = (srcPos.y + dstPos.y) / 2;
    //
            //const dirX = dstPos.x - controlPointX;
            //const dirY = dstPos.y - controlPointY;
            //const magnitude = Math.sqrt(dirX * dirX + dirY * dirY);
            //const normDirX = dirX / magnitude;
            //const normDirY = dirY / magnitude;
    //
            //const angleRadians = Math.atan2(normDirY, normDirX);
    //
            //const arrowHeadLength = this.arrowObject.pointerLength() + this.arrowObject.pointerWidth();
            //const offsetX = Math.cos(angleRadians) * (NodeWrapper.NodeRadius + arrowHeadLength * 0.3);
            //const offsetY = Math.sin(angleRadians) * (NodeWrapper.NodeRadius + arrowHeadLength * 0.3);
    //
            //const adjustedEndX = dstPos.x - offsetX;
            //const adjustedEndY = dstPos.y - offsetY;

            let xDestRelativeToSrc = dstPos.x - srcPos.x;
            let yDestRelativeToSrc = dstPos.y - srcPos.y;
            const midX = (srcPos.x + dstPos.x) / 2;
            const midY = (srcPos.y + dstPos.y) / 2;

            let magnitude = Math.sqrt(xDestRelativeToSrc * xDestRelativeToSrc + yDestRelativeToSrc * yDestRelativeToSrc);

            let normDirX = xDestRelativeToSrc / magnitude;
            let normDirY = yDestRelativeToSrc / magnitude;

            let normVector = Math.atan2(normDirY, normDirX) + Math.PI/2;
            let controlPointX = midX + 50 * Math.cos(normVector);
            let controlPointY = midY + 50 * Math.sin(normVector);


    
            //this.arrowObject.points([srcPos.x, srcPos.y, controlPointX, controlPointY, adjustedEndX, adjustedEndY]);
            this.arrowObject.points([srcPos.x, srcPos.y, controlPointX, controlPointY, dstPos.x, dstPos.y]);
            this.arrowObject.tension(0.5);
    
            this.labelObject.x(midX);
            this.labelObject.y(midY - 25);

            // Calculating the midpoint of the Bezier curve using adjusted Y value
            const adjustmentValue = 43;
            const adjustedControlPointY = controlPointY - adjustmentValue;
            const t = 0.5;
            const oneMinusT = 1 - t;
            const bx = (oneMinusT * oneMinusT * srcPos.x) + 
                        (2 * oneMinusT * t * controlPointX) + 
                        (t * t * dstPos.x);
            const by = (oneMinusT * oneMinusT * srcPos.y) + 
                        (2 * oneMinusT * t * adjustedControlPointY) + 
                        (t * t * dstPos.y);
         
            this.labelCenterDebugObject.position({ x: bx, y: by });
        } else {
            let xDestRelativeToSrc = dstPos.x - srcPos.x;
            let yDestRelativeToSrc = dstPos.y - srcPos.y;
    
            let magnitude = Math.sqrt(xDestRelativeToSrc * xDestRelativeToSrc + yDestRelativeToSrc * yDestRelativeToSrc);
    
            let newMag = NodeWrapper.NodeRadius + TransitionWrapper.ExtraTransitionArrowPadding;
            let xUnitTowardsSrc = xDestRelativeToSrc / magnitude * newMag;
            let yUnitTowardsSrc = yDestRelativeToSrc / magnitude * newMag;
    
            this.arrowObject.points([
                srcPos.x,
                srcPos.y,
                dstPos.x - xUnitTowardsSrc,
                dstPos.y - yUnitTowardsSrc
            ]);
    
            this.arrowObject.tension(0);
    
            const xAvg = ((srcPos.x + xUnitTowardsSrc) + (dstPos.x - xUnitTowardsSrc)) / 2;
            const yAvg = ((srcPos.y + yUnitTowardsSrc) + (dstPos.y - yUnitTowardsSrc)) / 2;
    
            const xCenter = xAvg;
            const yCenter = yAvg;
            this.labelObject.x(xCenter);
            this.labelObject.y(yCenter);
    
            this.labelCenterDebugObject.position({x: xCenter, y: yCenter});
        }
    }
    

    public involvesNode(node: NodeWrapper): boolean {
        return this._sourceNode === node || this._destNode === node;
    }

    public onClick(ev: Konva.KonvaEventObject<MouseEvent>) {
        if (StateManager.currentTool === Tool.Select) {
            // If shift isn't being held, then clear all previous selection
            if (!ev.evt.shiftKey) {
                StateManager.deselectAllObjects();
            }
            StateManager.selectObject(this);
        }
    }

    public select(): void {
        this.arrowObject.fill(StateManager.colorScheme.transitionSelectedArrowColor);
        this.arrowObject.stroke(StateManager.colorScheme.transitionSelectedArrowColor);
    }

    public deselect(): void {
        this.arrowObject.fill(StateManager.colorScheme.transitionArrowColor);
        this.arrowObject.stroke(StateManager.colorScheme.transitionArrowColor);
    }

    public konvaObject(): Konva.Node {
        return this.konvaGroup;
    }

    public deleteKonvaObjects(): void {
        this.konvaGroup.destroy();
    }

    public addToken(tok: TokenWrapper) {
        this._tokens.add(tok);
        this.updatePoints();
    }

    public removeToken(tok: TokenWrapper) {
        this._tokens.delete(tok);
        this.updatePoints();
    }

    public hasToken(tok: TokenWrapper): boolean {
        return this._tokens.has(tok);
    }

    public set isEpsilonTransition(value: boolean) {
        this._isEpsilonTransition = value;
        this.updatePoints();
    }

    public get isEpsilonTransition(): boolean {
        return this._isEpsilonTransition;
    }

    public toJSON() {
        return {
            id: this.id,
            source: this._sourceNode.id,
            dest: this._destNode.id,
            isEpsilonTransition: this.isEpsilonTransition,
            tokens: Array.from(this._tokens.values()).map(tok => tok.id)
        };
    }

    public updateColorScheme() {
        this.arrowObject.fill(StateManager.colorScheme.transitionArrowColor);
        this.arrowObject.stroke(StateManager.colorScheme.transitionArrowColor);
        this.labelObject.fill(StateManager.colorScheme.transitionLabelColor);
    }
}