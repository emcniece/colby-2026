;(function(root) {

  /**
   * @file Provides functionality related to dropzone image upload
   * @copyright Copyright (C) 2019 Van City Studios {@link https://www.vancitystudios.com/}
   */

  root.Dropzone = Dropzone;

  /**
   * Simple Emitter
   */
  function Emitter() {
    this.events = {};
  }

  /**
   * Attach an event listener
   * @param {string} type - Event type
   * @param {Function} callback - Event listener
   * @returns {void}
   */
  Emitter.prototype.on = function(type, callback) {
    this.events[type] = this.events[type] || [];
    this.events[type].push(callback);
  };

  /**
   * Remove the existing event listener
   * @param {string} type - Event type
   * @param {Function} callback - Event listener used in ".on" method
   * @returns {void}
   */
  Emitter.prototype.off = function(type, callback) {
    if (this.events[type]) {
      this.events[type].splice(this.events[type].indexOf(callback), 1);
    }
  };

  /**
   * Emit an event
   * @param {string} type - Event type
   * @param {...any} args - Arguments for the listener callback function
   * @returns {void}
   */
  Emitter.prototype.emit = function(type) {
    if (this.events[type]) {
      var args = Array.prototype.slice.call(arguments).slice(1);

      this.events[type].forEach(function(listener) {
        listener.apply(this, args);
      });
    }
  };


  /**
   * Constructor
   * @param {HTMLElement|string} [dropzone='.dropzone'] - Dropzone element,
   * or selector (selector must refer to unique element)
   * @param {Object} [options={}] - Dropzone configuration options
   */
  function Dropzone(dropzone, options) {
    Emitter.call(this);

    options = options || {};

    options.paramName = options.paramName || '';
    options.maxFiles = options.maxFiles || 1;
    options.maxFileSize = options.maxFileSize || 2;
    options.imageWidth = options.imageWidth || 140;
    options.imageHeight = options.imageHeight || 140;
    options.thumbnailWidth = options.thumbnailWidth || 72;
    options.thumbnailHeight = options.thumbnailHeight || 72;
    options.acceptedFiles = options.acceptedFiles || 'image/jpeg,image/png';
    options.messageElement = options.messageElement || '.dropzone-message';
    options.errorElement = options.errorElement || '.dropzone-error';
    options.thumbnailsContainer = options.thumbnailsContainer || '.dropzone-thumbnails';
    options.thumbnailTemplate = options.thumbnailTemplate || Dropzone.THUMBNAIL_TEMPLATE;
    options.messageWhenNoDrop = options.messageWhenNoDrop || 'Click here to upload a picture';

    if (typeof dropzone !== 'string' && !(dropzone instanceof HTMLElement)) {
      throw new TypeError('Invalid dropzone type. It must be a string or HTMLElement.');
    }

    if (typeof options.thumbnailsContainer !== 'string' && !(options.thumbnailsContainer instanceof HTMLElement)) {
      throw new TypeError('Invalid thumbnailsContainer type. It must be a string or HTMLElement.');
    }

    if (typeof options.messageElement !== 'string' && !(options.messageElement instanceof HTMLElement)) {
      throw new TypeError('Invalid messageElement type. It must be a string or HTMLElement.');
    }

    if (typeof options.errorElement !== 'string' && !(options.errorElement instanceof HTMLElement)) {
      throw new TypeError('Invalid errorElement type. It must be a string or HTMLElement.');
    }

    if (typeof options.paramName !== 'string') {
      throw new TypeError('Invalid paramName type. It must be a string.');
    }

    if (Number.isNaN(+options.maxFiles)) {
      throw new TypeError('Invalid maxFiles type. It must be a number.');
    }

    if (Number.isNaN(+options.maxFileSize)) {
      throw new TypeError('Invalid maxFileSize type. It must be a number.');
    }

    if (Number.isNaN(+options.imageWidth)) {
      throw new TypeError('Invalid imageWidth type. It must be a number.');
    }

    if (Number.isNaN(+options.imageHeight)) {
      throw new TypeError('Invalid imageHeight type. It must be a number.');
    }

    if (Number.isNaN(+options.thumbnailWidth)) {
      throw new TypeError('Invalid thumbnailWidth type. It must be a number.');
    }

    if (Number.isNaN(+options.thumbnailHeight)) {
      throw new TypeError('Invalid thumbnailHeight type. It must be a number.');
    }

    if (typeof options.acceptedFiles !== 'string') {
      throw new TypeError('Invalid acceptedFiles type. It must be a string.');
    }

    if (typeof options.thumbnailTemplate !== 'string') {
      throw new TypeError('Invalid thumbnailTemplate type. It must be a string');
    }

    this.dropzone = dropzone instanceof HTMLElement
      ? dropzone : document.querySelector(dropzone);
    if (!this.dropzone) throw new ReferenceError('Invalid dropzone selector.');

    var parentForm = getParents(this.dropzone, 'form')[0];

    this.thumbnailsContainer = options.thumbnailsContainer instanceof HTMLElement
      ? options.thumbnailsContainer : parentForm.querySelector(options.thumbnailsContainer);
    if (!this.thumbnailsContainer) throw new ReferenceError('Invalid thumbnailsContainer selector.');

    this.messageElement = options.messageElement instanceof HTMLElement
      ? options.messageElement : parentForm.querySelector(options.messageElement);
    if (!this.messageElement) throw new ReferenceError('Invalid messageElement selector.');

    this.errorElement = options.errorElement instanceof HTMLElement
      ? options.errorElement : parentForm.querySelector(options.errorElement);
    if (!this.errorElement) throw new ReferenceError('Invalid errorElement selector.');

    if (options.paramName) {
      this.inputFileElement = parentForm.querySelector('input[type="file"][name="' + options.paramName + '"]');
    } else {
      this.inputFileElement = getParents(this.dropzone, '.form-group')[0].querySelector('input[type="file"]');
    }
    if (!this.inputFileElement) throw new ReferenceError('Invalid paramName.');

    this.options = options;
    this.areFilesDropped = false;

    this.setupEventListeners();
    this.setupEmitterEventListeners();
  }

  Dropzone.prototype = Object.create(Emitter.prototype);
  Dropzone.prototype.constructor = Dropzone;

  /**
   * Event values
   * @type {Object}
   */
  Dropzone.EVENT = {
    ADDED_FILES: 'addedfile'
  };

  /**
   * Thumbnail default template
   * @type {string}
   */
  Dropzone.THUMBNAIL_TEMPLATE = '<span class="dropzone-thumbnail-container d-flex mb-2 bounce-in">'
    + '<span class="dropzone-thumbnail-image"></span>'
    + '</span>';

  /**
   * Check if drag and drop is supported
   * @returns {boolean}
   */
  Dropzone.isDragNDropSupported = function() {
    return 'draggable' in document.createElement('span');
  };


  Dropzone.prototype.getEXIFOrientation = function(img) {
    return new Promise(function(resolve) {
      EXIF.getData(img, function () {
        resolve(EXIF.getTag(this, 'Orientation'));
      }.bind(this));
    }.bind(this));
  };


  /**
   * Check if input type file is settable
   * @private
   * @returns {boolean}
   */
  Dropzone.prototype.isInputFileSettable = function() {
    try {
      this.inputFileElement.files = this.inputFileElement.files;

      return true;
    } catch (err) {
      return false;
    }
  };

  /**
   * Setup event listeners
   * @private
   * @returns {void}
   */
  Dropzone.prototype.setupEventListeners = function() {
    if (this.constructor.isDragNDropSupported() && this.isInputFileSettable()) {
      this.dropzone.addEventListener('dragenter', function(e) {
        e.stopPropagation();
        e.preventDefault();

        this.dropzone.querySelector('.dropzone-container').classList.toggle('dropzone-drag-hover');
      }.bind(this));

      this.dropzone.addEventListener('dragover', function(e) {
        e.stopPropagation();
        e.preventDefault();
      });

      this.dropzone.addEventListener('dragend', function(e) {
        e.stopPropagation();
        e.preventDefault();

        this.dropzone.querySelector('.dropzone-container').classList.toggle('dropzone-drag-hover');
      }.bind(this));

      this.dropzone.addEventListener('dragleave', function(e) {
        e.stopPropagation();
        e.preventDefault();

        this.dropzone.querySelector('.dropzone-container').classList.toggle('dropzone-drag-hover');
      }.bind(this));

      this.dropzone.addEventListener('drop', function(e) {
        e.stopPropagation();
        e.preventDefault();

        this.clearError();

        this.dropzone.querySelector('.dropzone-container').classList.toggle('dropzone-drag-hover');

        var files = e.dataTransfer.files;

        if (!this.areFilesAccepted(files)) {
          this.showError('Allowed file types are: ' + this.getListOfAcceptedFiles(files));
        } else if (!Array.from(files).every(function(file) {
            return file.size / 1024 / 1024 < this.options.maxFileSize;
          }.bind(this))) {
          this.showError('Maximum file size is ' + this.options.maxFileSize + 'MB');
        } else if (files.length > this.options.maxFiles) {
          this.showError('Maximum number of files is ' + this.options.maxFiles);
        } else {
          // We need this because Chrome doesn't trigger input element change event but Safari does
          this.areFilesDropped = true;

          this.inputFileElement.files = files;

          this.emit(Dropzone.EVENT.ADDED_FILES, files);
        }
      }.bind(this), true);
    } else {
      this.messageElement.innerText = this.options.messageWhenNoDrop;
    }

    this.inputFileElement.addEventListener('change', function() {
      if (!this.areFilesDropped) {
        this.clearError();

        var files = this.inputFileElement.files;

        if (files.length) {
          if (!this.areFilesAccepted(files)) {
            this.showError('Allowed file types are: ' + this.getListOfAcceptedFiles(files));
          } else {
            this.emit(Dropzone.EVENT.ADDED_FILES, files);
          }
        }
      }
    }.bind(this));
  };

  /**
   * Check if the files are accepted
   * @private
   * @param {FileList} files
   * @returns {boolean}
   */
  Dropzone.prototype.areFilesAccepted = function(files) {
    return Array.from(files).every(function(file) {
      return file.type && this.options.acceptedFiles.includes(file.type);
    }.bind(this));
  };

  /**
   * Get the list of accepted files
   * @private
   * @returns {string}
   */
  Dropzone.prototype.getListOfAcceptedFiles = function() {
    var regex = /(?:\w+\/(\w+),*)/g;
    var mimeFileTypes = [];

    var match = regex.exec(this.options.acceptedFiles);
    while (match) {
      mimeFileTypes.push(match[1]);
      match = regex.exec(this.options.acceptedFiles);
    }

    return mimeFileTypes.join(', ');
  };

  /**
   * Show a thumbnail
   * @private
   * @param {HTMLImageElement} thumbnail
   * @returns {void}
   */
  Dropzone.prototype.showThumbnail = function(thumbnail) {
    var div = document.createElement('div');

    div.innerHTML = this.options.thumbnailTemplate;
    div = div.firstElementChild;

    this.thumbnailsContainer.appendChild(div);

    div.querySelector('.dropzone-thumbnail-image').appendChild(thumbnail);
  };

  /**
   * Setup emitter event listeners
   * @private
   * @returns {void}
   */
  Dropzone.prototype.setupEmitterEventListeners = function() {
    this.on(Dropzone.EVENT.ADDED_FILES, function(files) {
      this.areFilesDropped = false;
      this.thumbnailsContainer.innerHTML = '';

      Array.from(files).forEach(function(file) {
        if (file.type.match(/image\/(?:jpeg|png)/)) {
          this.resizeImage(file, this.options.thumbnailWidth, this.options.thumbnailHeight)
            .then(function(thumbnail) {
              this.showThumbnail(thumbnail);
            }.bind(this));
        }
      }.bind(this));
    }.bind(this));
  };

  /**
   * Resize image from url
   * @private
   * @param {string} url - Image url
   * @param {number} width - New width
   * @param {number} height - New height
   * @returns {Promise<HTMLCanvasElement>}
   */
  Dropzone.prototype.resizeImageFromUrl = function(url, type, width, height) {
    return new Promise(function(resolve, reject) {
      var img = document.createElement('img');

      img.src = url;

      img.onload = function() {
        var thumbnailAspectRatio = width / height;
        var imageAspectRatio = img.naturalWidth / img.naturalHeight;

        // Fix orientation
        this.getEXIFOrientation(img)
          .then(function(orientation) {
            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');

            if (imageAspectRatio >= thumbnailAspectRatio) {
              canvas.width = Math.round(height * imageAspectRatio);
              canvas.height = height;
            } else {
              canvas.width = this.options.thumbnailWidth;
              canvas.height = Math.round(width / imageAspectRatio);
            }

            switch (orientation) {
              case 2:
                // horizontal flip
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1);
                break;
              case 3:
                // 180° rotate left
                ctx.translate(canvas.width, canvas.height);
                ctx.rotate(Math.PI);
                break;
              case 4:
                // vertical flip
                ctx.translate(0, canvas.height);
                ctx.scale(1, -1);
                break;
              case 5:
                // vertical flip + 90 rotate right
                ctx.rotate(0.5 * Math.PI);
                ctx.scale(1, -1);
                break;
              case 6:
                // 90° rotate right
                ctx.rotate(0.5 * Math.PI);
                ctx.translate(0, -canvas.width);
                break;
              case 7:
                // horizontal flip + 90 rotate right
                ctx.rotate(0.5 * Math.PI);
                ctx.translate(canvas.height, -canvas.width);
                ctx.scale(-1, 1);
                break;
              case 8:
                // 90° rotate left
                ctx.rotate(-0.5 * Math.PI);
                ctx.translate(-canvas.height, 0);
                break;
              default:
                break;
            }

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // Crop
            var cropCanvas = document.createElement('canvas');
            var cropCanvasCtx = cropCanvas.getContext('2d');

            cropCanvas.width = width;
            cropCanvas.height = height;

            cropCanvasCtx.drawImage(
              canvas,
              Math.round(canvas.width / 2 - cropCanvas.width / 2),
              Math.round(canvas.height / 2 - cropCanvas.height / 2),
              cropCanvas.width,
              cropCanvas.height,
              0,
              0,
              cropCanvas.width,
              cropCanvas.height
            );

            resolve(cropCanvas);
          }.bind(this));
      }.bind(this);

      img.onerror = function(e) {
        reject(e);
      };

    }.bind(this));
  };

  /**
   * Resize given image file to given dimensions
   * @private
   * @param {File} imageFile - Image file to resize
   * @param {number} width - New width
   * @param {number} height - New height
   * @returns {Promise<HTMLImageElement>}
   */
  Dropzone.prototype.resizeImage = function(imageFile, width, height) {
    return new Promise(function(resolve, reject) {
      var reader = new FileReader();

      reader.readAsDataURL(imageFile);

      reader.onload = function(e) {
        this.resizeImageFromUrl(e.target.result, imageFile.type, width, height)
          .then(function(canvas) {
            var img = document.createElement('img');

            img.onload = function() { resolve(img) };
            img.onerror = function(imgError) { reject(imgError) };

            img.src = canvas.toDataURL(imageFile.type);

            resolve(img);
          }.bind(this));
      }.bind(this);

      reader.onerror = function(e) {
        reject(e);
      };

    }.bind(this));
  };

  /**
   * Clear error, if any
   * @private
   * @returns {void}
   */
  Dropzone.prototype.clearError = function() {
    this.errorElement.classList.remove('bounce-in');
    this.errorElement.innerText = '';

    void this.errorElement.offsetWidth;
  };

  /**
   * Show error to the user
   * @private
   * @param {string} message
   * @returns {void}
   */
  Dropzone.prototype.showError = function(message) {
    this.errorElement.innerText = message;
    this.errorElement.classList.add('bounce-in');
  };
})(window);