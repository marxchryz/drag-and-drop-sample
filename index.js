/* eslint-disable import/no-absolute-path */
import interact from 'https://cdn.interactjs.io/v1.10.11/interactjs/index.js';

let isInDroppable = false;
let parent = undefined;
let drops = {};

let draggableIds = [...document.querySelectorAll('.draggable.js-drag')].map(
  (e) => '#'.concat(e.id)
);
let droppableIds = [...document.querySelectorAll('.dropzone.js-drop')].map(
  (e) => '#'.concat(e.id)
);
for (let i = 0; i < droppableIds.length; i++) {
  drops[droppableIds[i]] = [];
}

let transformProp;
const dragPositions = draggableIds.reduce((acc, n) => {
  acc[n.slice(1)] = { x: 0, y: 0 };
  return acc;
}, {});

// add eventlistener on doubleclick
[...document.querySelectorAll('.draggable.js-drag')].map((draggable) => {
  draggable.addEventListener('dblclick', (e) => {
    resetPosition('#' + draggable.id);
    Object.keys(drops).map((k) => {
      if (drops[k].includes('#' + draggable.id)) {
        drops[k] = [];
      }
    });
    console.table(
      Object.keys(drops).map((d) => document.querySelector(drops?.[d]?.[0]))
    );
  });
});

interact.maxInteractions(Infinity);

// setup draggable elements.
interact('.js-drag').draggable({
  listeners: {
    start(event) {
      const position = dragPositions[event.target.id];
      position.x = parseInt(event.target.getAttribute('data-x'), 10) || 0;
      position.y = parseInt(event.target.getAttribute('data-y'), 10) || 0;
      parent = droppableIds.filter((droppableId) =>
        drops[droppableId].includes('#'.concat(event.target.id))
      )?.[0];
      // console.log(parent);
    },
    move(event) {
      const position = dragPositions[event.target.id];
      position.x += event.dx;
      position.y += event.dy;

      if (transformProp) {
        event.target.style[transformProp] =
          'translate(' + position.x + 'px, ' + position.y + 'px)';
      } else {
        event.target.style.left = position.x + 'px';
        event.target.style.top = position.y + 'px';
      }
    },
    end(event) {
      const position = dragPositions[event.target.id];
      event.target.setAttribute('data-x', position.x);
      event.target.setAttribute('data-y', position.y);
      if (!isInDroppable) {
        if (parent) {
          snap(
            document.getElementById(event.target.id),
            document.querySelector(parent)
          );
          // console.log('may parent pero wala sa lapagan');
        } else {
          resetPosition('#'.concat(event.target.id));
        }
      }
      isInDroppable = false;
      console.table(
        Object.keys(drops).map(
          (d) => document.querySelector(drops?.[d]?.[0])?.innerText
        )
      );
    },
  },
});

// setup drop areas.
// dropzone #1 accepts draggable #1
// setupDropzone('#drop1', '#drag1');
// dropzone #2 accepts draggable #1 and #2
// setupDropzone('#drop2', '#drag1, #drag2');
// every dropzone accepts draggable #3
for (let i = 0; i < droppableIds.length; i++) {
  setupDropzone(droppableIds[i], draggableIds.join(', '));
}

/**
 * Setup a given element as a dropzone.
 *
 * @param {HTMLElement|String} target
 * @param {String} accept
 */
function setupDropzone(target, accept) {
  interact(target)
    .dropzone({
      accept: accept,
      ondropactivate: function (event) {
        addClass(event.relatedTarget, '-drop-possible');
      },
      ondropdeactivate: function (event) {
        removeClass(event.relatedTarget, '-drop-possible');
      },
    })
    .on('dropactivate', (event) => {
      const active = event.target.getAttribute('active') | 0;
      // change style if it was previously not active
      if (active === 0) {
        addClass(event.target, '-drop-possible');
        // event.target.textContent = 'Drop me here!';
      }

      event.target.setAttribute('active', active + 1);
    })
    .on('dropdeactivate', (event) => {
      const active = event.target.getAttribute('active') | 0;

      // change style if it was previously active
      // but will no longer be active
      if (active === 1) {
        removeClass(event.target, '-drop-possible');
        // event.target.textContent = 'Dropzone';
      }

      event.target.setAttribute('active', active - 1);
    })
    .on('dragenter', (event) => {
      isInDroppable = true;
      addClass(event.target, '-drop-over');
      // event.relatedTarget.textContent = "I'm in";
    })
    .on('dragleave', (event) => {
      isInDroppable = false;
      removeClass(event.target, '-drop-over');
      // event.relatedTarget.textContent = 'Drag me???';
      drops['#'.concat(event.currentTarget.id)] = drops[
        '#'.concat(event.currentTarget.id)
      ].filter((e) => e !== '#'.concat(event.relatedTarget.id));
    })
    .on('drop', (event) => {
      // console.log('drop');
      removeClass(event.target, '-drop-over');
      // event.relatedTarget.textContent = 'Dropped';
      let previousContents = [...drops['#'.concat(event.currentTarget.id)]];

      // snap or swap
      if (parent && previousContents.length) {
        // swap
        snap(
          document.querySelector(previousContents[0]),
          document.querySelector(parent)
        );
        snap(event.relatedTarget, event.currentTarget);
      } else {
        // snap target
        snap(event.relatedTarget, event.currentTarget);
        // reset position pag may old contents
        previousContents.map((q) => resetPosition(q));
      }

      // remove old drops array
      if (previousContents.length) {
        drops['#'.concat(event.currentTarget.id)] = [
          '#'.concat(event.relatedTarget.id),
        ];
      }
    });
}

function snap(relatedTarget, currentTarget) {
  let drop = drops['#'.concat(currentTarget.id)];
  drop.push('#'.concat(relatedTarget.id));
  // get dropzone points
  let dropzonePoints = currentTarget.getBoundingClientRect();
  let dropzoneHorizontalMiddlePoint =
    (dropzonePoints.right + dropzonePoints.left) / 2;
  let dropzoneVerticalMiddlePoint =
    (dropzonePoints.bottom + dropzonePoints.top) / 2;
  // reset position to calculate
  resetPosition('#'.concat(relatedTarget.id));
  // get draggabble midpoints
  let draggablePoints = relatedTarget.getBoundingClientRect();
  let draggableHorizontalMiddlePoint =
    (draggablePoints.right + draggablePoints.left) / 2;
  let draggableVerticalMiddlePoint =
    (draggablePoints.bottom + draggablePoints.top) / 2;
  // calculate offset
  let horizontalOffset =
    dropzoneHorizontalMiddlePoint - draggableHorizontalMiddlePoint;
  let verticalOffset =
    dropzoneVerticalMiddlePoint - draggableVerticalMiddlePoint;
  // set position
  relatedTarget.setAttribute(
    'style',
    `left: ${horizontalOffset}px; top: ${verticalOffset}px`
  );
  relatedTarget.setAttribute('data-x', horizontalOffset);
  relatedTarget.setAttribute('data-y', verticalOffset);
}

function resetPosition(id) {
  let element = document.querySelector(id);
  element.style.top = 0;
  element.style.left = 0;
  element.setAttribute('data-x', '');
  element.setAttribute('data-y', '');
}

function addClass(element, className) {
  if (element.classList) {
    return element.classList.add(className);
  } else {
    element.className += ' ' + className;
  }
}

function removeClass(element, className) {
  if (element.classList) {
    return element.classList.remove(className);
  } else {
    element.className = element.className.replace(
      new RegExp(className + ' *', 'g'),
      ''
    );
  }
}

/* eslint-disable multiline-ternary */
interact(document).on('ready', () => {
  transformProp =
    'transform' in document.body.style
      ? 'transform'
      : 'webkitTransform' in document.body.style
      ? 'webkitTransform'
      : 'mozTransform' in document.body.style
      ? 'mozTransform'
      : 'oTransform' in document.body.style
      ? 'oTransform'
      : 'msTransform' in document.body.style
      ? 'msTransform'
      : null;
});
/* eslint-enable multiline-ternary */

window.getDrops = () => {
  return drops;
};

window.resetDrops = () => {
  for (let i = 0; i < droppableIds.length; i++) {
    drops[droppableIds[i]] = [];
  }
  for (let i = 0; i < draggableIds.length; i++) {
    resetPosition(draggableIds[i]);
  }
};
