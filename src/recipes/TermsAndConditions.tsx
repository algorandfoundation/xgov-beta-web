import { CheckIcon } from "@radix-ui/react-icons";

export function TermsAndConditions({
  setAgreed,
}: {
  setAgreed: (value: boolean) => void;
}) {
  return (
    <div className="p-4 rounded-lg bg-algo-blue-20 dark:bg-algo-teal-20">
      <h1 className="font-bold">Terms and Conditions</h1>
      <p className="text-algo-black-60 mb-4">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut tincidunt a
        diam in vehicula. Cras mollis iaculis tortor sit amet dapibus. Etiam ac
        risus pulvinar, faucibus leo vel, facilisis mi. Aenean cursus nibh sed
        leo faucibus, at suscipit velit congue. Duis sit amet lacus
        pellentesque, ullamcorper eros nec, lacinia justo. Sed pharetra nibh at
        ligula condimentum semper. Vivamus venenatis, purus sit amet
        sollicitudin sollicitudin, ex justo fringilla sapien, ac euismod purus
        orci consequat dolor. Donec nec pretium lectus. In sagittis metus ac
        erat hendrerit lacinia. Donec hendrerit quam et nibh ullamcorper
        vulputate. In in mauris et sapien tincidunt sagittis. Vestibulum eu nunc
        nisl. Pellentesque rutrum dictum vehicula. Curabitur et eros nisi. Sed
        interdum felis a dignissim accumsan. Etiam vitae elit sed nulla commodo
        tincidunt. Class aptent taciti sociosqu ad litora torquent per conubia
        nostra, per inceptos himenaeos. Cras aliquet erat a viverra lobortis.
        Nullam eu mi pulvinar, faucibus ligula nec, feugiat magna. Suspendisse
        ultrices ex vel fringilla convallis.Lorem ipsum dolor sit amet,
        consectetur adipiscing elit. Ut tincidunt a diam in vehicula. Cras
        mollis iaculis tortor sit amet dapibus. Etiam ac risus pulvinar,
        faucibus leo vel, facilisis mi. Aenean cursus nibh sed leo faucibus, at
        suscipit velit congue. Duis sit amet lacus pellentesque, ullamcorper
        eros nec, lacinia justo. Sed pharetra nibh at ligula condimentum semper.
        Vivamus venenatis, purus sit amet sollicitudin sollicitudin, ex justo
        fringilla sapien, ac euismod purus orci consequat dolor. Donec nec
        pretium lectus. In sagittis metus ac erat hendrerit lacinia. Donec
        hendrerit quam et nibh ullamcorper vulputate. In in mauris et sapien
        tincidunt sagittis.
      </p>
      <button
        type="button"
        className="group w-full p-4 flex items-center justify-start gap-2 border border-algo-blue-50 dark:border-algo-teal-50 hover:bg-algo-blue-50 dark:hover:bg-algo-teal-30 hover:text-algo-white dark:hover:text-algo-black rounded-md"
        onClick={() => setAgreed(true)}
      >
        <div className="h-5 w-5 flex items-center justify-center border border-algo-black rounded-sm">
          <CheckIcon className="h-4 w-4 opacity-0 group-hover:opacity-100" />
        </div>
        <span>I've read and agree to the terms and conditions</span>
      </button>
    </div>
  );
}
