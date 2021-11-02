import TextEditor from "./components/TextEditor";
import "./App.css";
import "./styles.css";

import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from "react-router-dom";

import { v4 as uuidV4 } from "uuid";
const App = () => {
  return (
    <Router className="App">
      <Switch>
        <Route exact path="/">
          <Redirect to={`/documents/${uuidV4()}`} />
        </Route>
        <Route exact path="/documents/:id" component={TextEditor} />
      </Switch>
    </Router>
  );
};

export default App;
