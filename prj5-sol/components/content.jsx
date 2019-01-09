//-*- mode: rjsx-mode;

'use strict';

const React = require('react');


class Content extends React.Component {

  /** called with properties:
   *  app: An instance of the overall app.  Note that props.app.ws
   *       will return an instance of the web services wrapper and
   *       props.app.setContentName(name) will set name of document
   *       in content tab to name and switch to content tab.
   *  name:Name of document to be displayed.
   */
  constructor(props) {
    super(props);
    //@TODO
      this.state = {
        name: this.props.name,
        content: ''
      };
     // this.getCon = this.getCon.bind(this);
  }

  //@TODO

  async componentDidMount(){
    if(this.state.name !== "" && this.state.name !== undefined && this.state.name !== null){
        await this.getCon();
    }
  }

  async componentDidUpdate(previousProps){
      console.log("hello update");
      if(this.props.name !== previousProps.name){
          this.state.name = this.props.name;
          await this.getCon();
      }
      /*if(this.state.name !== "" && this.state.name !== undefined && this.state.name !== null){
          await this.getCon();
      }*/
  }

  async getCon(){
      const content = await this.props.app.ws.getContent(this.state.name);
      this.setState({
        content: content.content
    });
  }

  render() {
    //@TODO
    return (
        <div className="tab-content">
            <section>
                <h1>
                    {this.state.name}
                </h1>
              <pre>
                  {this.state.content}
              </pre>
            </section>
        </div>
    );
  }

}

module.exports = Content;
