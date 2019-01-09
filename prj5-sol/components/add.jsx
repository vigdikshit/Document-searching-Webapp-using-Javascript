//-*- mode: rjsx-mode;

'use strict';

const React = require('react');
const Content = require('./content.jsx');

class Add extends React.Component {

  /** called with properties:
   *  app: An instance of the overall app.  Note that props.app.ws
   *       will return an instance of the web services wrapper and
   *       props.app.setContentName(name) will set name of document
   *       in content tab to name and switch to content tab.
   */
  constructor(props) {
    super(props);
    //@TODO
      this.status = false;
      this.state = {
          name: '',
          content : ''
      };
  }

  //@TODO add code

  //Note that a you can get information on the file being uploaded by
  //hooking the change event on <input type="file">.  It will have
  //event.target.files[0] set to an object containing information
  //corresponding to the uploaded file.  You can get the contents
  //of the file by calling the provided readFile() function passing
  //this object as the argument.

    async getUpload(event) {
      this.status = true;
        let file  = event.target.files[0];
        const content = await readFile(file);
        let name = file.name;
        name = name.substr(0, name.lastIndexOf('.')) || name;
        const add = await this.props.app.ws.addContent(name, content);
        this.setState({
            name: name
        });
        this.props.app.setContentName(name);
    }

    contentRender(status){
      if(status){
          return <Content name = {this.state.name} />;
      }
    }

  render() {
    //@TODO
    return(
        <div className="tab-content">
        <form>
            <label className = "label">
                Choose File:
            <input className = "control" type="file" name="upload"
                   onChange = {this.getUpload.bind(this)}/>
            </label>
            {
                this.contentRender()
            }
        </form>
        </div>
    );
  }

}

module.exports = Add;

/** Return contents of file (of type File) read from user's computer.
 *  The file argument is a file object corresponding to a <input
 *  type="file"/>
 */
async function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>  resolve(reader.result);
    reader.readAsText(file);
  });
}