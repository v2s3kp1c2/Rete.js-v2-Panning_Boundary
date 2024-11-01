import { createRoot } from "react-dom/client";
import { NodeEditor, GetSchemes, ClassicPreset } from "rete";
import { AreaPlugin, AreaExtensions } from "rete-area-plugin";
import {
  ConnectionPlugin,
  Presets as ConnectionPresets
} from "rete-connection-plugin";
import { ReactPlugin, Presets, ReactArea2D } from "rete-react-plugin";
import { setupPanningBoundary } from "./panning-boundary";

type Schemes = GetSchemes<
  ClassicPreset.Node,
  ClassicPreset.Connection<ClassicPreset.Node, ClassicPreset.Node>
>;
type AreaExtra = ReactArea2D<Schemes>;

const socket = new ClassicPreset.Socket("socket");

function createNode(label: string) {
  const node = new ClassicPreset.Node(label);

  node.addInput("a", new ClassicPreset.Input(socket));
  node.addOutput("a", new ClassicPreset.Output(socket));

  return node;
}

export async function createEditor(container: HTMLElement) {
  const editor = new NodeEditor<Schemes>();
  const area = new AreaPlugin<Schemes, AreaExtra>(container);
  const connection = new ConnectionPlugin<Schemes, AreaExtra>();
  const render = new ReactPlugin<Schemes, AreaExtra>({ createRoot });

  const selector = AreaExtensions.selector();

  AreaExtensions.selectableNodes(area, selector, {
    accumulating: AreaExtensions.accumulateOnCtrl()
  });

  render.addPreset(Presets.classic.setup());

  connection.addPreset(ConnectionPresets.classic.setup());

  editor.use(area);
  area.use(connection);
  area.use(render);

  AreaExtensions.simpleNodesOrder(area);

  const panningBoundary = setupPanningBoundary({
    area,
    selector,
    padding: 50,
    intensity: 3
  });

  const a = createNode("A");
  await editor.addNode(a);
  await area.translate(a.id, { x: 0, y: 0 });

  const b = createNode("B");
  await editor.addNode(b);
  await area.translate(b.id, { x: 300, y: 0 });

  const c = createNode("C");
  await editor.addNode(c);
  await area.translate(c.id, { x: 0, y: 200 });

  const d = createNode("D");
  await editor.addNode(d);
  await area.translate(d.id, { x: 300, y: 200 });

  setTimeout(() => {
    // wait until nodes rendered because they dont have predefined width and height
    AreaExtensions.zoomAt(area, editor.getNodes(), { scale: 0.6 });
  }, 100);

  return {
    destroy: () => {
      area.destroy();
      panningBoundary.destroy();
    }
  };
}
